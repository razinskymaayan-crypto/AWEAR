"""
AWEAR — MVP demo backend (Layer 1)
Photo of an outfit -> Claude Vision identifies each clothing item -> digital closet.

Run:
    venv312/bin/uvicorn app:app --reload --port 8000
Then open http://localhost:8000
"""

import base64
import io
import os

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

load_dotenv()  # loads ANTHROPIC_API_KEY from .env

MODEL = "claude-opus-4-8"
MAX_EDGE = 1024  # downscale long edge to control cost + latency

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
app = FastAPI(title="AWEAR demo")


# ---- Structured output schema: what Claude returns for each photo ----

class ClothingItem(BaseModel):
    category: str          # top | bottoms | dress | outerwear | shoes | bag | accessory
    name: str              # short human name, e.g. "white cropped tee"
    color: str             # dominant color
    material_guess: str    # best guess of fabric/material
    brand_vibe: str        # brand/aesthetic guess (e.g. "Zara-like", "vintage", "unknown")
    style_tags: list[str]  # e.g. ["casual", "streetwear", "y2k"]
    resale_potential: str  # low | medium | high  (Layer 3 hook)


class OutfitAnalysis(BaseModel):
    items: list[ClothingItem]
    overall_style: str     # one short phrase
    occasion: str          # where this outfit fits
    trend_score: int       # 0-100, how on-trend the look reads
    summary: str           # one friendly sentence for the user


SYSTEM_PROMPT = (
    "You are the AI stylist inside AWEAR, a fashion app for Gen-Z (think a 17-year-old "
    "in Tel Aviv, active on TikTok and Instagram). A user uploads a photo of their daily "
    "outfit. Identify EVERY distinct clothing item and accessory you can see on the person. "
    "Be specific and confident — this populates their digital wardrobe. For each item give a "
    "short catchy name, the dominant color, a material guess, a brand/aesthetic vibe, style "
    "tags, and an honest resale potential. Then summarize the overall look. Keep names short "
    "and trendy. If something is uncertain, still make your best guess rather than leaving it out."
)


def _downscale_to_base64(raw: bytes) -> tuple[str, str]:
    """Resize the uploaded image and return (base64_data, media_type)."""
    img = Image.open(io.BytesIO(raw))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.thumbnail((MAX_EDGE, MAX_EDGE))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.standard_b64encode(buf.getvalue()).decode("utf-8"), "image/jpeg"


@app.post("/api/analyze")
async def analyze(photo: UploadFile):
    raw = await photo.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        b64, media_type = _downscale_to_base64(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Bad image: {exc}") from exc

    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Analyze this outfit and break it into wardrobe items.",
                        },
                    ],
                }
            ],
            output_format=OutfitAnalysis,
        )
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key — check ANTHROPIC_API_KEY in .env",
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}") from exc

    if response.parsed_output is None:
        raise HTTPException(status_code=502, detail="Could not parse the outfit")

    return response.parsed_output.model_dump()


@app.get("/")
async def index():
    return FileResponse("static/index.html")


app.mount("/static", StaticFiles(directory="static"), name="static")
