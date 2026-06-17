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
from typing import Optional

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

from google_services import create_calendar_event, schedule_agent_meeting, send_summary_email

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
    "You are the AI stylist inside AWEAR, a global fashion app. "
    "A user uploads a photo of their outfit from anywhere in the world. "
    "Identify EVERY distinct clothing item and accessory visible on the person.\n\n"
    "CRITICAL — be SPECIFIC, not generic:\n"
    "• If you can see a brand logo or label, name the exact brand and model "
    "(e.g. 'Adidas Samba OG', 'Levi's 501', 'Nike Air Force 1', 'Acne Studios scarf').\n"
    "• Describe the EXACT silhouette, cut, and fit "
    "(e.g. 'wide-leg', 'cropped', 'oversized', 'slim-fit', 'barrel-leg', 'boxy').\n"
    "• Describe the EXACT color, pattern, texture, and wash "
    "(e.g. 'acid-wash light blue', 'ribbed off-white', 'chocolate brown corduroy', 'camel plaid').\n"
    "• `search_query` must be precise enough to find THIS exact item globally — "
    "not 'white tee' but 'white ribbed cropped sleeveless tank top women'. "
    "Include brand if identified, silhouette, color, material, and gender.\n"
    "• `name` should be short, trendy, and descriptive in the user's likely language — "
    "default to English if unsure (e.g. 'White Ribbed Crop Top', 'Barrel-Leg Light Wash Denim', 'Adidas Samba White').\n\n"
    "For each item: name, dominant color, material guess, brand_vibe (actual brand if visible, else aesthetic), "
    "style tags (global fashion vocabulary: y2k, streetwear, minimal, vintage, preppy, coastal, etc.), "
    "resale potential, search_query (precise English for global retailers), "
    "price_estimate_ils (estimated retail price in USD — use integer).\n\n"
    "Then summarize the overall look in English and produce `stylist_tip` — "
    "one short, actionable styling suggestion in English. "
    "If you can confidently detect the user's language from any visible text or context, use that language instead."
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

# (display name, search URL template, scope) — all global, zero approval required.
RETAILERS = [
    ("Google Shopping", "https://www.google.com/search?tbm=shop&q={q}", "global"),
    ("ASOS", "https://www.asos.com/search/?q={q}", "global"),
    ("Depop", "https://www.depop.com/search/?q={q}", "global"),
    ("ZARA", "https://www.zara.com/ww/en/search?searchTerm={q}", "global"),
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


import random as _random

_DEMO_OUTFITS = [
    {
        "items": [
            {"category": "top", "name": "White Ribbed Crop Top", "color": "white",
             "material_guess": "cotton", "brand_vibe": "Zara", "style_tags": ["minimal", "y2k"],
             "resale_potential": "medium", "search_query": "white ribbed cropped sleeveless tank top women", "price_estimate_ils": 25},
            {"category": "bottoms", "name": "Barrel-Leg Light Wash Denim", "color": "light blue",
             "material_guess": "denim", "brand_vibe": "Levi's",
             "style_tags": ["denim", "y2k", "casual"], "resale_potential": "high",
             "search_query": "barrel leg light wash jeans women", "price_estimate_ils": 80},
            {"category": "shoes", "name": "Adidas Samba OG White", "color": "white/black",
             "material_guess": "leather", "brand_vibe": "Adidas",
             "style_tags": ["retro", "sporty", "iconic"], "resale_potential": "high",
             "search_query": "adidas samba og white black sneakers", "price_estimate_ils": 120},
        ],
        "overall_style": "Y2K Minimal",
        "occasion": "Everyday / Coffee shop",
        "trend_score": 91,
        "summary": "Clean Y2K-inspired look — white crop with barrel denim and Sambas. Effortless and on-trend.",
        "stylist_tip": "Add a slim gold chain and a mini shoulder bag to elevate this look from casual to polished.",
    },
    {
        "items": [
            {"category": "outerwear", "name": "Oversized Camel Blazer", "color": "camel",
             "material_guess": "wool blend", "brand_vibe": "& Other Stories",
             "style_tags": ["preppy", "minimal", "smart-casual"], "resale_potential": "high",
             "search_query": "oversized camel blazer women wool", "price_estimate_ils": 150},
            {"category": "bottoms", "name": "Straight-Leg Black Trousers", "color": "black",
             "material_guess": "polyester blend", "brand_vibe": "COS",
             "style_tags": ["minimal", "office", "classic"], "resale_potential": "medium",
             "search_query": "straight leg black tailored trousers women", "price_estimate_ils": 70},
            {"category": "shoes", "name": "Pointed-Toe Leather Mules", "color": "black",
             "material_guess": "leather", "brand_vibe": "Mango",
             "style_tags": ["minimal", "elegant"], "resale_potential": "medium",
             "search_query": "pointed toe black leather mules women", "price_estimate_ils": 60},
        ],
        "overall_style": "Minimal Chic",
        "occasion": "Office / Dinner",
        "trend_score": 88,
        "summary": "Sharp minimal look — camel blazer over black trousers reads confident and effortless.",
        "stylist_tip": "Try a simple white tee under the blazer instead of nothing — softens the look for daytime.",
    },
    {
        "items": [
            {"category": "top", "name": "Vintage Band Graphic Tee", "color": "black",
             "material_guess": "cotton", "brand_vibe": "vintage",
             "style_tags": ["streetwear", "vintage", "grunge"], "resale_potential": "high",
             "search_query": "vintage black band graphic tee oversized", "price_estimate_ils": 35},
            {"category": "bottoms", "name": "Baggy Cargo Pants Khaki", "color": "khaki",
             "material_guess": "cotton twill", "brand_vibe": "Carhartt",
             "style_tags": ["streetwear", "utility", "y2k"], "resale_potential": "high",
             "search_query": "baggy cargo pants khaki women utility", "price_estimate_ils": 90},
            {"category": "shoes", "name": "New Balance 550 White Cream", "color": "white/cream",
             "material_guess": "leather", "brand_vibe": "New Balance",
             "style_tags": ["retro", "sporty", "streetwear"], "resale_potential": "high",
             "search_query": "new balance 550 white cream sneakers", "price_estimate_ils": 110},
            {"category": "bag", "name": "Mini Crossbody Black Canvas", "color": "black",
             "material_guess": "canvas", "brand_vibe": "streetwear",
             "style_tags": ["streetwear", "everyday"], "resale_potential": "low",
             "search_query": "mini black canvas crossbody bag streetwear", "price_estimate_ils": 30},
        ],
        "overall_style": "Urban Streetwear",
        "occasion": "Weekend / Street",
        "trend_score": 94,
        "summary": "Strong streetwear moment — vintage tee, cargo utility, NB550s. Authentic and well-layered.",
        "stylist_tip": "Tuck the front of the tee halfway into the cargos for more shape — it balances the baggy silhouette.",
    },
]


def _demo_analysis() -> dict:
    """Fallback for when the AI is unavailable (no API key, timeout, etc.).
    Returns a random realistic outfit so repeated demo scans feel varied.
    mode='demo' is set by the caller — never silently pretend this is a real scan."""
    return _random.choice(_DEMO_OUTFITS).copy()


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


# ---------------------------------------------------------------------------
# Agent endpoints — email summaries + calendar events
# ---------------------------------------------------------------------------

class MeetingSummary(BaseModel):
    agent: str                          # jeff | ayalon | steve | mark | varan | sam | board
    department: str                     # display name, e.g. "Product"
    attendees: str
    summary: str
    completed: list[str] = []
    in_progress: list[str] = []
    decisions: list[str] = []
    board_approval: list[str] = []
    next_step: str = ""


class CalendarEvent(BaseModel):
    agent: str
    title: str
    start_iso: str                      # e.g. "2026-06-18T10:00:00+03:00"
    end_iso: str
    description: str = ""
    attendees: list[str] = []


@app.post("/api/agent/summary")
async def agent_summary(data: MeetingSummary):
    """Send meeting summary email to company inbox."""
    ok = send_summary_email(
        agent=data.agent,
        department=data.department,
        summary=data.dict(),
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send email — check GMAIL_APP_PASSWORD in .env")
    return {"status": "sent"}


@app.post("/api/agent/schedule")
async def agent_schedule(data: CalendarEvent):
    """Create a Google Calendar event on behalf of an agent."""
    url = create_calendar_event(
        agent=data.agent,
        title=data.title,
        start_iso=data.start_iso,
        end_iso=data.end_iso,
        description=data.description,
        attendees=data.attendees or None,
    )
    if not url:
        raise HTTPException(status_code=500, detail="Failed to create calendar event — check google_token.json")
    return {"status": "created", "event_url": url}


class AgentMeeting(BaseModel):
    organizer: str           # agent who calls the meeting, e.g. "jeff"
    participants: list       # list of agent keys, e.g. ["steve", "mark"]
    title: str
    start_iso: str           # e.g. "2026-06-18T10:00:00+03:00"
    end_iso: str
    description: str = ""


@app.post("/api/agent/meeting")
async def agent_meeting(data: AgentMeeting):
    """Schedule a meeting between agents — organizer invites participants."""
    url = schedule_agent_meeting(
        organizer=data.organizer,
        participants=data.participants,
        title=data.title,
        start_iso=data.start_iso,
        end_iso=data.end_iso,
        description=data.description,
    )
    if not url:
        raise HTTPException(status_code=500, detail="Failed to create meeting — check google_token.json")
    return {"status": "created", "event_url": url}


# ---------------------------------------------------------------------------
# AI Stylist Chat
# ---------------------------------------------------------------------------

class OutfitRequest(BaseModel):
    occasion: str
    wardrobe: list = []
    style_vibes: list = []


@app.post("/api/outfit/generate")
async def generate_outfit(data: OutfitRequest):
    """Generate outfit suggestions for a given occasion using the user's wardrobe."""
    wardrobe_desc = ", ".join(
        f"{it.get('name','')} ({it.get('category','')})"
        for it in data.wardrobe[:30]
    ) or "empty wardrobe"

    system = (
        "You are AWEAR's AI stylist, serving users worldwide. Generate 2-3 outfit "
        "suggestions for the requested occasion, using the user's existing wardrobe "
        "as much as possible. Reply in the same language the occasion/request is "
        "written in (default to English if unsure). "
        "Return JSON only (no markdown): "
        '{"outfits": [{"name": "outfit name", "match_pct": 85, "tip": "short tip", '
        '"items": [{"name": "item name", "category": "top/bottoms/shoes/bag/outerwear", '
        '"_missing": false}]}]}'
        " — _missing: true if the item isn't in the wardrobe and needs to be bought."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=800,
            system=system,
            messages=[{
                "role": "user",
                "content": (
                    f"Occasion: {data.occasion}\n"
                    f"Wardrobe: {wardrobe_desc}\n"
                    f"Preferred styles: {', '.join(data.style_vibes) or 'any'}"
                ),
            }],
        )
        import json as _json
        text = response.content[0].text.strip()
        # strip markdown fences if present
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
            text = text.rstrip("`").strip()
        return _json.loads(text)
    except Exception:
        return {"outfits": []}


class DeclutterRequest(BaseModel):
    wardrobe: list = []


@app.post("/api/declutter")
async def smart_declutter(data: DeclutterRequest):
    """AI suggests what to sell/donate from the wardrobe."""
    unused = [i for i in data.wardrobe if (i.get("wear_count") or 0) == 0]
    if not unused:
        return {"suggestions": []}

    items_desc = "\n".join(
        f"- {it.get('name','?')} ({it.get('category','?')}) {it.get('price_estimate_ils',0)}"
        for it in unused[:20]
    )
    system = (
        "You are AWEAR's AI wardrobe manager, serving users worldwide. Review this list "
        "of items that were never worn. For each item, suggest: action (sell/donate/recycle), "
        "a short reason, price_suggestion (60% of the original price for resale). "
        "Reply in the same language the item names are written in (default to English if unsure). "
        'Return JSON only: {"suggestions": [{"name":"...","action":"sell","reason":"...","price_suggestion":120}]}'
    )
    try:
        response = client.messages.create(
            model=MODEL, max_tokens=600,
            system=system,
            messages=[{"role": "user", "content": f"Unworn items:\n{items_desc}"}],
        )
        import json as _json
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:]).rstrip("`").strip()
        return _json.loads(text)
    except Exception:
        return {"suggestions": [
            {"name": it.get("name","?"), "action": "sell",
             "reason": "never worn",
             "price_suggestion": round((it.get("price_estimate_ils") or 100) * 0.4)}
            for it in unused[:5]
        ]}


class StylistMessage(BaseModel):
    question: str
    wardrobe_context: str = ""


@app.post("/api/stylist/chat")
async def stylist_chat(data: StylistMessage):
    """AI Stylist: answers fashion questions with optional wardrobe context."""
    system = (
        "You are Abigail, the AI stylist inside AWEAR — a global fashion app. "
        "You help users style their wardrobe, suggest outfits, and give honest fashion advice. "
        "Reply in the same language the user writes in. Keep answers short (2-3 sentences), "
        "friendly, specific, and actionable. Use the wardrobe data when available to give "
        "personalized suggestions. Not every answer should be 'buy something' — "
        "the best advice often uses what's already in the closet."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=400,
            system=system,
            messages=[{
                "role": "user",
                "content": f"Wardrobe info: {data.wardrobe_context}\n\nQuestion: {data.question}",
            }],
        )
        return {"answer": response.content[0].text}
    except Exception:
        return {"answer": "AI stylist unavailable right now 🙏 try again in a moment"}


class CommentModerationRequest(BaseModel):
    text: str


@app.post("/api/moderate")
async def moderate_comment(data: CommentModerationRequest):
    """Claude-based comment moderation (language-agnostic, not a keyword filter).

    Returns {"harmful": bool, "severity": "none"|"medium"|"high"}.
    Fails open (severity "none") on any error — moderation must never be the
    reason a comment is silently blocked because of an infra issue. We log
    the fallback so it's visible instead of invisible.
    """
    system = (
        "You moderate comments on a global fashion social app. Given a single "
        "user comment in any language, decide if it is harmful (harassment, hate "
        "speech, threats, explicit sexual content, severe bullying, etc.) and rate "
        "its severity. Respond with ONLY a compact JSON object, no prose, no markdown "
        "fences, in exactly this shape: "
        '{"harmful": true|false, "severity": "none"|"medium"|"high"}. '
        "\"none\" = not harmful at all. \"medium\" = borderline/rude/mildly offensive "
        "but not dangerous. \"high\" = clearly harmful (hate speech, harassment, "
        "threats, explicit content)."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=50,
            system=system,
            messages=[{"role": "user", "content": data.text}],
        )
        import json as _json
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:]).rstrip("`").strip()
        parsed = _json.loads(text)
        severity = parsed.get("severity", "none")
        if severity not in ("none", "medium", "high"):
            severity = "none"
        return {"harmful": bool(parsed.get("harmful", False)), "severity": severity}
    except Exception as e:
        print(f"[moderate] fallback to severity=none due to: {e}")
        return {"harmful": False, "severity": "none", "fallback": True}


app.mount("/static", StaticFiles(directory="static"), name="static")
