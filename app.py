"""
AWEAR — MVP demo backend
Photo of an outfit -> Claude Vision identifies each clothing item -> digital closet
-> "Shop the Look": every item becomes a real, purchasable product via affiliate links.

The commerce layer is built so it works WITHOUT any brand partnership: affiliate
networks (AWIN / Sovrn / Skimlinks / Impact) approve instantly and pay a commission
on any referred sale. No Zara/ASOS approval required to launch.

Run:
    venv312/bin/uvicorn app:app --reload --port 8000
Then open http://localhost:8000
"""

import base64
import io
import urllib.parse

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

# ~25s request timeout so a hung/slow call raises anthropic.APITimeoutError instead of
# spinning forever — the broad except in /api/analyze then yields the demo fallback,
# keeping a live pitch from hanging.
client = anthropic.Anthropic(timeout=25.0)  # reads ANTHROPIC_API_KEY from the environment
app = FastAPI(title="AWEAR demo")


# ---------------------------------------------------------------------------
# Structured output schema: what Claude returns for each photo
# ---------------------------------------------------------------------------

class ClothingItem(BaseModel):
    category: str           # top | bottoms | dress | outerwear | shoes | bag | accessory
    name: str               # short human name, e.g. "white cropped tee"
    color: str              # dominant color
    material_guess: str     # best guess of fabric/material
    brand_vibe: str         # brand/aesthetic guess (e.g. "Zara-like", "vintage")
    style_tags: list[str]   # e.g. ["casual", "streetwear", "y2k"]
    resale_potential: str   # low | medium | high  (Layer 3: sell hook)
    search_query: str       # precise EN shopping query, e.g. "white ribbed cropped tee"
    price_estimate_ils: int  # estimated retail price in ILS


class OutfitAnalysis(BaseModel):
    items: list[ClothingItem]
    overall_style: str      # one short phrase
    occasion: str           # where this outfit fits
    trend_score: int        # 0-100, how on-trend the look reads
    summary: str            # one friendly sentence for the user
    stylist_tip: str        # Layer 4: one short styling suggestion (what to pair / when to wear)


SYSTEM_PROMPT = (
    "You are the AI stylist inside AWEAR, a fashion app for Gen-Z (a 17-year-old in "
    "Tel Aviv, active on TikTok and Instagram). A user uploads a photo of their daily "
    "outfit. Identify EVERY distinct clothing item and accessory on the person — this "
    "populates their digital wardrobe and a 'Shop the Look' commerce feed. For each item: "
    "a short catchy name, dominant color, material guess, brand/aesthetic vibe, style tags, "
    "and honest resale potential. ALSO for each item produce `search_query` — a short, precise "
    "ENGLISH shopping query someone would type to buy this exact item (e.g. 'white ribbed "
    "cropped tee', 'black cargo parachute pants') — and `price_estimate_ils`, your best "
    "estimate of its retail price in Israeli shekels (integer). Then summarize the look, and "
    "produce `stylist_tip` — one short, friendly styling suggestion in Hebrew (what to pair it "
    "with, what's missing, or when to wear it). Keep names short and trendy. If uncertain, still make your best guess. "
    "Reply in the same language the app's user would use (default Hebrew for names/summary; "
    "keep `search_query` in English so it matches global retailer catalogs)."
)


# ---------------------------------------------------------------------------
# Commerce layer — "Shop the Look" works WITHOUT any brand partnership.
#
# Affiliate networks (AWIN / Sovrn / Skimlinks / Impact) approve publishers in days,
# need no sales volume, and pay a commission on any referred purchase. `affiliate_url`
# is the SINGLE integration point: today it returns a working retailer search link;
# swap in a network deep-link (or local Israeli D2C brand) here and every "Buy" button
# across the whole app monetizes — no Zara/ASOS approval required to launch.
# ---------------------------------------------------------------------------

AFFILIATE_TAG = "awear"  # replace with the real network publisher id once signed

# (display name, search URL template, scope) — search URLs work today with zero approval.
RETAILERS = [
    ("Google Shopping", "https://www.google.com/search?tbm=shop&q={q}", "global"),
    ("ASOS", "https://www.asos.com/search/?q={q}", "global"),
    ("Terminal X", "https://www.terminalx.com/catalogsearch/result/?q={q}", "israel"),
]


def affiliate_url(url: str) -> str:
    """Single monetization hook. Swap raw link -> affiliate network deep-link here."""
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}aff={AFFILIATE_TAG}"


def build_buy_options(query: str) -> list[dict]:
    q = urllib.parse.quote(query)
    return [
        {"retailer": name, "scope": scope, "url": affiliate_url(tmpl.format(q=q))}
        for name, tmpl, scope in RETAILERS
    ]


def _demo_analysis() -> dict:
    """Realistic fallback so the demo NEVER breaks — e.g. without a valid API key.
    A pitch should never crash on stage; this keeps the full flow working as a simulation."""
    return {
        "items": [
            {"category": "top", "name": "חולצת ריב לבנה קרופ", "color": "לבן",
             "material_guess": "כותנה", "brand_vibe": "Zara-like",
             "style_tags": ["casual", "minimal", "y2k"], "resale_potential": "medium",
             "search_query": "white ribbed cropped tee", "price_estimate_ils": 79},
            {"category": "bottoms", "name": "מכנסי קרגו פראשוט בז'", "color": "בז'",
             "material_guess": "ניילון", "brand_vibe": "streetwear",
             "style_tags": ["streetwear", "utility"], "resale_potential": "high",
             "search_query": "beige parachute cargo pants", "price_estimate_ils": 159},
            {"category": "shoes", "name": "סניקרס Adidas Samba", "color": "לבן/שחור",
             "material_guess": "עור", "brand_vibe": "Adidas",
             "style_tags": ["retro", "iconic"], "resale_potential": "high",
             "search_query": "adidas samba sneakers", "price_estimate_ils": 449},
            {"category": "bag", "name": "תיק כתף מיני שחור", "color": "שחור",
             "material_guess": "דמוי עור", "brand_vibe": "vintage",
             "style_tags": ["minimal", "everyday"], "resale_potential": "medium",
             "search_query": "black mini shoulder bag", "price_estimate_ils": 119},
        ],
        "overall_style": "סטריטוור מינימלי",
        "occasion": "יום־יום / בית קפה בתל אביב",
        "trend_score": 88,
        "summary": "לוק נקי וטרנדי — בסיס לבן עם קרגו וסמבות, מנצח לבית קפה.",
        "stylist_tip": "תוסיפי שרשרת זהב עדינה וכובע בייסבול והלוק עולה רמה — ובערב פשוט תזרקי מעליו ז'קט דנים.",
    }


# ---------------------------------------------------------------------------

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

    # Try live AI recognition; on any failure (e.g. invalid key) fall back to a
    # realistic demo so the app NEVER breaks during a live pitch.
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
                            "text": "Analyze this outfit, break it into wardrobe items, and make each shoppable.",
                        },
                    ],
                }
            ],
            output_format=OutfitAnalysis,
        )
        if response.parsed_output is None:
            raise ValueError("empty parse")
        result = response.parsed_output.model_dump()
        result["mode"] = "live"
    except Exception:  # noqa: BLE001 — auth/api/parse failure -> graceful demo fallback
        result = _demo_analysis()
        result["mode"] = "demo"

    # Enrich each item with shoppable buy options + a "shop the whole look" total.
    look_total = 0
    for item in result["items"]:
        item["buy_options"] = build_buy_options(item["search_query"])
        look_total += item.get("price_estimate_ils") or 0
    result["look_total_ils"] = look_total
    return result


@app.get("/")
async def index():
    return FileResponse("static/index.html")


app.mount("/static", StaticFiles(directory="static"), name="static")
