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
import datetime
import hashlib
import io
import json
import logging
import os
import sqlite3
import uuid
import time
import traceback
import urllib.parse
import urllib.request
import warnings
from collections import defaultdict
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

import anthropic
from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Structured logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("awear")

# ---------------------------------------------------------------------------
# In-memory rate limiter (per-IP, per-endpoint)
# ---------------------------------------------------------------------------

_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str, endpoint: str, limit: int) -> bool:
    """Return True if the request is allowed, False if the limit is exceeded.

    Sliding window: only timestamps within the last RATE_WINDOW seconds count.
    Thread-safety note: FastAPI runs in a single-process async event loop for
    this demo, so a plain dict is safe here. Switch to Redis for multi-worker.
    """
    key = f"{client_ip}:{endpoint}"
    now = time.time()
    _rate_store[key] = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(_rate_store[key]) >= limit:
        return False
    _rate_store[key].append(now)
    return True

# Google integrations are optional — if the deps/creds aren't installed, the core
# demo must still run. Degrade to no-ops instead of crashing the whole server.
try:
    from google_services import create_calendar_event, schedule_agent_meeting, send_summary_email
except Exception:  # noqa: BLE001 — missing google libs/creds shouldn't break the app
    def _google_unavailable(*_a, **_k):
        raise RuntimeError("Google integration not configured on this machine")
    create_calendar_event = schedule_agent_meeting = send_summary_email = _google_unavailable

load_dotenv()  # loads ANTHROPIC_API_KEY from .env

# ---------------------------------------------------------------------------
# Startup validation
# ---------------------------------------------------------------------------

_api_key = os.getenv("ANTHROPIC_API_KEY")
if not _api_key:
    warnings.warn(
        "ANTHROPIC_API_KEY not set — /api/moderate running in fail-open mode. "
        "Set the key in .env before production deploy.",
        RuntimeWarning,
        stacklevel=2,
    )

MODEL = "claude-opus-4-8"
MAX_EDGE = 1024  # downscale long edge to control cost + latency

# ~25s request timeout so a hung/slow call raises anthropic.APITimeoutError instead of
# spinning forever — the broad except in /api/analyze then yields the demo fallback,
# keeping a live pitch from hanging.
client = anthropic.Anthropic(timeout=25.0)  # reads ANTHROPIC_API_KEY from the environment
app = FastAPI(title="AWEAR demo")


# ---------------------------------------------------------------------------
# Request logging middleware — logs every HTTP request with method, path,
# status code, and duration in milliseconds.
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception as exc:
        logger.exception("Unhandled exception during %s %s", request.method, request.url.path)
        raise
    finally:
        duration = round((time.time() - start) * 1000)
        logger.info(
            "%s %s -> %s (%dms)",
            request.method,
            request.url.path,
            status_code,
            duration,
        )


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
    price_estimate_usd: int  # estimated retail price in USD


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
    "price_estimate_usd (estimated retail price in USD — use integer).\n\n"
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

# Resale / commission economics — canonicalized per Ayalon's product decision
# (agents/ayalon_product_decisions_2026-06-18.md, decision #3). These were previously
# scattered as inconsistent literals (40%/50%/60%) across app.py and static/index.html;
# this is now the single source of truth on the backend. They are two independent
# numbers, not competing definitions: the seller's suggested resale price is
# RESALE_SUGGESTION_PCT of the original estimated price, and AWEAR_COMMISSION_PCT is
# the cut AWEAR takes on top of the eventual sale price.
RESALE_SUGGESTION_PCT = 0.5   # suggested resale price = 50% of original price estimate
AWEAR_COMMISSION_PCT = 0.15   # AWEAR's commission on a completed resale, on top of the above

# ---------------------------------------------------------------------------
# Currency — static reference rates, NOT live FX.
#
# Per Ayalon's product decision (agents/ayalon_product_decisions_2026-06-18.md, decision #2):
# canonical storage/estimate currency across the app is USD (see ClothingItem.price_estimate_usd
# and SYSTEM_PROMPT above). These are fixed, hand-maintained approximate rates for converting
# a USD estimate into other currencies for *display* purposes only — they are NOT pulled from
# a live FX API and will drift from the real market rate over time. That's an intentional v1
# scope call, not an oversight: live/paid FX is explicitly NOT approved (needs a separate
# budget/vendor decision with Jeff/the board) since these are "shop the look" price estimates,
# not real payment-processing amounts. Revisit (cron-refresh, or a real FX API) only if
# conversion-accuracy complaints actually show up — see Ayalon's doc for the exact trigger.
#
# This is intentionally NOT wired into every endpoint yet — it's the primitive other
# endpoints/the frontend can adopt incrementally as multi-currency display work continues.
CURRENCY_BASE = "USD"

# Approximate units of each currency per 1 USD. Update occasionally (manually, or via a
# future cron job) — do not treat as authoritative for real transactions.
STATIC_FX_RATES_PER_USD = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "ILS": 3.7,
    "CAD": 1.36,
    "AUD": 1.52,
    "JPY": 156.0,
}


def convert_from_usd(amount_usd: float, to_currency: str) -> float:
    """Convert a USD amount to `to_currency` using the static reference table above.

    Display-only helper — not suitable for real payment/settlement math. Raises
    ValueError for an unsupported currency rather than silently returning the wrong
    number (fail loud, not silently).
    """
    code = to_currency.upper()
    if code not in STATIC_FX_RATES_PER_USD:
        raise ValueError(f"Unsupported currency: {to_currency!r}")
    return amount_usd * STATIC_FX_RATES_PER_USD[code]


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
             "resale_potential": "medium", "search_query": "white ribbed cropped sleeveless tank top women", "price_estimate_usd": 25},
            {"category": "bottoms", "name": "Barrel-Leg Light Wash Denim", "color": "light blue",
             "material_guess": "denim", "brand_vibe": "Levi's",
             "style_tags": ["denim", "y2k", "casual"], "resale_potential": "high",
             "search_query": "barrel leg light wash jeans women", "price_estimate_usd": 80},
            {"category": "shoes", "name": "Adidas Samba OG White", "color": "white/black",
             "material_guess": "leather", "brand_vibe": "Adidas",
             "style_tags": ["retro", "sporty", "iconic"], "resale_potential": "high",
             "search_query": "adidas samba og white black sneakers", "price_estimate_usd": 120},
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
             "search_query": "oversized camel blazer women wool", "price_estimate_usd": 150},
            {"category": "bottoms", "name": "Straight-Leg Black Trousers", "color": "black",
             "material_guess": "polyester blend", "brand_vibe": "COS",
             "style_tags": ["minimal", "office", "classic"], "resale_potential": "medium",
             "search_query": "straight leg black tailored trousers women", "price_estimate_usd": 70},
            {"category": "shoes", "name": "Pointed-Toe Leather Mules", "color": "black",
             "material_guess": "leather", "brand_vibe": "Mango",
             "style_tags": ["minimal", "elegant"], "resale_potential": "medium",
             "search_query": "pointed toe black leather mules women", "price_estimate_usd": 60},
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
             "search_query": "vintage black band graphic tee oversized", "price_estimate_usd": 35},
            {"category": "bottoms", "name": "Baggy Cargo Pants Khaki", "color": "khaki",
             "material_guess": "cotton twill", "brand_vibe": "Carhartt",
             "style_tags": ["streetwear", "utility", "y2k"], "resale_potential": "high",
             "search_query": "baggy cargo pants khaki women utility", "price_estimate_usd": 90},
            {"category": "shoes", "name": "New Balance 550 White Cream", "color": "white/cream",
             "material_guess": "leather", "brand_vibe": "New Balance",
             "style_tags": ["retro", "sporty", "streetwear"], "resale_potential": "high",
             "search_query": "new balance 550 white cream sneakers", "price_estimate_usd": 110},
            {"category": "bag", "name": "Mini Crossbody Black Canvas", "color": "black",
             "material_guess": "canvas", "brand_vibe": "streetwear",
             "style_tags": ["streetwear", "everyday"], "resale_potential": "low",
             "search_query": "mini black canvas crossbody bag streetwear", "price_estimate_usd": 30},
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
async def analyze(request: Request, photo: UploadFile):
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip, "analyze", limit=5):
        logger.warning("Rate limit exceeded: analyze from %s", ip)
        raise HTTPException(status_code=429, detail="Too many requests. Please wait.")

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
    except Exception as e:  # noqa: BLE001 — auth/api/parse failure -> graceful demo fallback
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
        result = _demo_analysis()
        result["mode"] = "demo"

    # Enrich each item with shoppable buy options + a "shop the whole look" total.
    look_total = 0
    for item in result["items"]:
        item["buy_options"] = build_buy_options(item["search_query"])
        look_total += item.get("price_estimate_usd") or 0
    result["look_total_usd"] = look_total
    return result


# ---------------------------------------------------------------------------
# Product images — proxy to Pexels (free API key) so clothing items show real
# catalog-style photos. The <img src> hits this endpoint, which 302-redirects
# straight to the matched photo. If PEXELS_API_KEY is unset or there's no match,
# it returns 404 so the frontend falls back to its clean designed placeholder
# (never a broken image, never an emoji). Results are cached in-memory per query.
# ---------------------------------------------------------------------------
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "").strip()
_product_image_cache: dict[str, str] = {}


@app.get("/api/product-image")
def product_image(q: str = ""):
    q = (q or "").strip().lower()
    if not q or not PEXELS_API_KEY:
        return Response(status_code=404)
    if q not in _product_image_cache:
        url = ""
        try:
            req = urllib.request.Request(
                "https://api.pexels.com/v1/search?"
                + urllib.parse.urlencode({"query": q, "per_page": 1, "orientation": "portrait"}),
                headers={"Authorization": PEXELS_API_KEY},
            )
            with urllib.request.urlopen(req, timeout=5) as r:
                photos = json.loads(r.read().decode()).get("photos", [])
            url = photos[0]["src"]["large"] if photos else ""
        except Exception:  # noqa: BLE001 — image is best-effort; placeholder covers failures
            url = ""
        _product_image_cache[q] = url
    url = _product_image_cache[q]
    return RedirectResponse(url) if url else Response(status_code=404)


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
async def generate_outfit(request: Request, data: OutfitRequest):
    """Generate outfit suggestions for a given occasion using the user's wardrobe."""
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip, "outfit_generate", limit=10):
        logger.warning("Rate limit exceeded: outfit/generate from %s", ip)
        raise HTTPException(status_code=429, detail="Too many requests. Please wait.")
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
        text = response.content[0].text.strip()
        # strip markdown fences if present
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
            text = text.rstrip("`").strip()
        return json.loads(text)
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
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
        f"- {it.get('name','?')} ({it.get('category','?')}) {it.get('price_estimate_usd',0)}"
        for it in unused[:20]
    )
    system = (
        "You are AWEAR's AI wardrobe manager, serving users worldwide. Review this list "
        "of items that were never worn. For each item, suggest: action (sell/donate/recycle), "
        f"a short reason, price_suggestion ({round(RESALE_SUGGESTION_PCT * 100)}% of the "
        "original price for resale). "
        "Reply in the same language the item names are written in (default to English if unsure). "
        'Return JSON only: {"suggestions": [{"name":"...","action":"sell","reason":"...","price_suggestion":120}]}'
    )
    try:
        response = client.messages.create(
            model=MODEL, max_tokens=600,
            system=system,
            messages=[{"role": "user", "content": f"Unworn items:\n{items_desc}"}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:]).rstrip("`").strip()
        return json.loads(text)
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
        return {"suggestions": [
            {"name": it.get("name","?"), "action": "sell",
             "reason": "never worn",
             "price_suggestion": round((it.get("price_estimate_usd") or 100) * RESALE_SUGGESTION_PCT)}
            for it in unused[:5]
        ]}


class StylistMessage(BaseModel):
    question: str
    wardrobe_context: str = ""


@app.post("/api/stylist/chat")
async def stylist_chat(request: Request, data: StylistMessage):
    """AI Stylist: answers fashion questions with optional wardrobe context."""
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip, "stylist_chat", limit=20):
        logger.warning("Rate limit exceeded: stylist/chat from %s", ip)
        raise HTTPException(status_code=429, detail="Too many requests. Please wait.")
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
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
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
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:]).rstrip("`").strip()
        parsed = json.loads(text)
        severity = parsed.get("severity", "none")
        if severity not in ("none", "medium", "high"):
            severity = "none"
        return {"harmful": bool(parsed.get("harmful", False)), "severity": severity}
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
        return {"harmful": False, "severity": "none", "fallback": True}


# ---------------------------------------------------------------------------
# Data API — products / posts / profiles
# ---------------------------------------------------------------------------

PRODUCTS_PATH = Path("static/data/products.json")
POSTS_PATH = Path("static/data/posts.json")
PROFILES_PATH = Path("static/data/profiles.json")

# ---------------------------------------------------------------------------
# SQLite — persistent storage for social data (likes, etc.)
# ---------------------------------------------------------------------------

DB_PATH = Path("data/awear.db")


def _get_db() -> sqlite3.Connection:
    """Open a connection to the SQLite DB. row_factory enables dict-like row access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist yet. Safe to call on every startup."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS post_likes (
                post_id   TEXT NOT NULL,
                user_key  TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (post_id, user_key)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                follower_key      TEXT NOT NULL,
                followed_user_id  TEXT NOT NULL,
                created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_key, followed_user_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS saves (
                post_id    TEXT NOT NULL,
                user_key   TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (post_id, user_key)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT DEFAULT '',
                bio TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                created_at REAL
            )
        """)
        conn.commit()
    logger.info("DB init complete: %s", DB_PATH)

# In-memory caches — loaded once at startup, not on every request.
# Mutation is intentionally absent: these are read-only fixtures for the demo.
_products_cache: list = []
_posts_cache: list = []
_profiles_cache: list = []


@app.on_event("startup")
async def load_data_files():
    """Load JSON fixtures into memory once so every request is O(n) filter, not disk I/O.
    Also initialises the SQLite DB schema on first run.
    """
    global _products_cache, _posts_cache, _profiles_cache
    # DB init first — guaranteed before any request is served.
    init_db()
    try:
        with open(PRODUCTS_PATH) as f:
            _products_cache = json.load(f)
        with open(POSTS_PATH) as f:
            _posts_cache = json.load(f)
        with open(PROFILES_PATH) as f:
            _profiles_cache = json.load(f)
        logger.info(
            "Data loaded: %d products, %d posts, %d profiles",
            len(_products_cache), len(_posts_cache), len(_profiles_cache),
        )
    except Exception as e:
        # Log the error but don't crash — the endpoints will return empty lists
        # and the main analyze/scan flow continues to work.
        logger.error("Failed to load data files: %s", e)


@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    color: Optional[str] = None,
    in_stock: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
):
    """Return paginated products with optional filtering by category, color, and stock status."""
    products = _products_cache

    if category:
        products = [p for p in products if p.get("category") == category]
    if color:
        products = [p for p in products if p.get("color") == color]
    if in_stock is not None:
        products = [p for p in products if p.get("in_stock") == in_stock]

    total = len(products)
    return {
        "items": products[offset: offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/categories")
async def get_categories():
    """Return unique product categories with counts — for Marketplace filter chips."""
    counts: dict[str, int] = {}
    for p in _products_cache:
        cat = p.get("category")
        if cat:
            counts[cat] = counts.get(cat, 0) + 1
    return {
        "items": [{"name": k, "count": v} for k, v in sorted(counts.items())],
        "total": len(counts),
    }


@app.get("/api/posts")
async def get_posts(
    user_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """Return paginated posts, optionally filtered by user_id."""
    posts = _posts_cache

    if user_id:
        posts = [p for p in posts if p.get("user_id") == user_id]

    total = len(posts)
    return {
        "items": posts[offset: offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/profiles")
async def get_profiles(limit: int = 20, offset: int = 0):
    """Return paginated profiles."""
    profiles = _profiles_cache
    total = len(profiles)
    return {
        "items": profiles[offset: offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/profiles/{user_id}")
async def get_profile(user_id: str):
    """Return a single profile by user_id. 404 if not found."""
    profile = next((p for p in _profiles_cache if p.get("id") == user_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# ---------------------------------------------------------------------------
# Social layer — Likes (SQLite-backed, survives server restarts)
# ---------------------------------------------------------------------------


@app.post("/api/posts/{post_id}/like")
async def toggle_like(post_id: str, request: Request):
    """Toggle like on a post. Identified by IP (v1 — no auth).

    Persisted in SQLite post_likes table — survives server restarts.

    Returns:
        post_id: str
        liked: bool — the NEW state after toggle (True = now liked)
        likes: int  — total like count from DB
    """
    # Guard: request.client can be None behind certain reverse proxies. (MG-005)
    user_key = (request.client.host if request.client else None) or "anonymous"

    # Validate post exists if we have a cache.
    if _posts_cache:
        post = next((p for p in _posts_cache if p["id"] == post_id), None)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

    with _get_db() as conn:
        existing = conn.execute(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND user_key = ?",
            (post_id, user_key),
        ).fetchone()

        if existing:
            conn.execute(
                "DELETE FROM post_likes WHERE post_id = ? AND user_key = ?",
                (post_id, user_key),
            )
            liked = False
        else:
            conn.execute(
                "INSERT INTO post_likes (post_id, user_key) VALUES (?, ?)",
                (post_id, user_key),
            )
            liked = True

        conn.commit()

        total_likes = conn.execute(
            "SELECT COUNT(*) FROM post_likes WHERE post_id = ?",
            (post_id,),
        ).fetchone()[0]

    # Emit notification to post owner when a new like is added (not on unlike).
    # SF-004: direct function call — no HTTP to avoid ASGI deadlock.
    if liked and _posts_cache:
        post_obj = next((p for p in _posts_cache if p["id"] == post_id), None)
        if post_obj:
            _emit_notification(post_obj.get("user_id", ""), "like", user_key, post_id)

    return {
        "post_id": post_id,
        "liked": liked,
        "likes": total_likes,
    }


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str):
    """Return a single post by id, with persistent like count from DB."""
    post = next((p for p in _posts_cache if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    with _get_db() as conn:
        db_likes = conn.execute(
            "SELECT COUNT(*) FROM post_likes WHERE post_id = ?",
            (post_id,),
        ).fetchone()[0]

    return {**post, "likes": db_likes}


# ---------------------------------------------------------------------------
# User stats endpoint
# ---------------------------------------------------------------------------

@app.get("/api/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    """Compute lightweight stats for a user profile.

    Returns:
        user_id: str
        post_count: int  — number of posts by this user
        followers: int   — from profiles.json relationships (v1: static)
        following: int   — from profiles.json relationships (v1: static)
        total_likes: int — sum of likes across all user posts (SQLite post_likes)
    """
    # --- 404 guard: profile must exist ---
    profile = next((p for p in _profiles_cache if p.get("id") == user_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    # --- post_count ---
    user_posts = [p for p in _posts_cache if p.get("user_id") == user_id]
    post_count = len(user_posts)

    # --- followers / following (v1: static from JSON) ---
    followers = len(profile.get("followers", []))
    following = len(profile.get("following", []))

    # --- total_likes via SQLite ---
    post_ids = [p["id"] for p in user_posts]
    total_likes = 0

    if post_ids:
        placeholders = ",".join("?" * len(post_ids))
        with _get_db() as conn:
            row = conn.execute(
                f"SELECT COUNT(*) FROM post_likes WHERE post_id IN ({placeholders})",
                post_ids,
            ).fetchone()
            total_likes = row[0] if row else 0

    return {
        "user_id": user_id,
        "post_count": post_count,
        "followers": followers,
        "following": following,
        "total_likes": total_likes,
    }


# ---------------------------------------------------------------------------
# Follow / Unfollow — SQLite persistence (BE-004: in-memory → SQLite)
# ---------------------------------------------------------------------------

@app.post("/api/users/{user_id}/follow")
async def toggle_follow(user_id: str, request: Request):
    """Toggle follow status for a user. Returns new follow state + follower count."""
    follower_key = (request.client.host if request.client else None) or "anon"

    # Validate target user exists
    target = next((p for p in _profiles_cache if p.get("id") == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    with _get_db() as db:
        existing = db.execute(
            "SELECT 1 FROM follows WHERE follower_key=? AND followed_user_id=?",
            (follower_key, user_id),
        ).fetchone()

        if existing:
            db.execute(
                "DELETE FROM follows WHERE follower_key=? AND followed_user_id=?",
                (follower_key, user_id),
            )
            following = False
        else:
            db.execute(
                "INSERT INTO follows (follower_key, followed_user_id) VALUES (?, ?)",
                (follower_key, user_id),
            )
            following = True

        follow_delta = db.execute(
            "SELECT COUNT(*) FROM follows WHERE followed_user_id=?", (user_id,)
        ).fetchone()[0]

    base_followers = len(target.get("followers", []))
    return {
        "user_id": user_id,
        "following": following,
        "followers": base_followers + follow_delta,
    }


@app.get("/api/users/{user_id}/follow-status")
async def get_follow_status(user_id: str, request: Request):
    """Return current follow status for the requesting client."""
    follower_key = (request.client.host if request.client else None) or "anon"

    with _get_db() as db:
        row = db.execute(
            "SELECT 1 FROM follows WHERE follower_key=? AND followed_user_id=?",
            (follower_key, user_id),
        ).fetchone()

    return {"user_id": user_id, "following": row is not None}


@app.get("/api/search")
async def search(q: str, limit: int = 20):
    """
    Cross-entity search. q = query string.
    Searches products (name, brand, category), posts (caption, tags), profiles (display_name).
    Returns combined results with entity_type field.
    """
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="query must be at least 2 characters")

    q_lower = q.lower().strip()
    results = []

    # Products
    for p in _products_cache:
        if any(q_lower in str(p.get(f, "")).lower()
               for f in ["name", "brand", "category", "color"]):
            results.append({**p, "entity_type": "product"})

    # Posts
    for p in _posts_cache:
        caption = p.get("caption", "")
        tags = " ".join(p.get("tags", []))
        if q_lower in caption.lower() or q_lower in tags.lower():
            results.append({**p, "entity_type": "post"})

    # Profiles
    for p in _profiles_cache:
        if q_lower in p.get("display_name", "").lower() or q_lower in p.get("username", "").lower():
            results.append({**p, "entity_type": "profile"})

    return {
        "query": q,
        "items": results[:limit],
        "total": len(results),
    }


# ---------------------------------------------------------------------------
# Save / Bookmark — SQLite persistence (mirrors likes pattern, BE-004)
# ---------------------------------------------------------------------------

@app.post("/api/posts/{post_id}/save")
async def toggle_save(post_id: str, request: Request):
    """Toggle bookmark for a post. Returns current saved state.

    Uses IP-based user identification (v1, same as likes).
    404 when _posts_cache is populated but post_id is not found.
    When cache is empty (startup race), we allow the toggle without a 404
    so the endpoint doesn't break before the first load_data_files completes.
    """
    user_key = (request.client.host if request.client else None) or "anon"

    if _posts_cache:
        post = next((p for p in _posts_cache if p["id"] == post_id), None)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

    with _get_db() as db:
        existing = db.execute(
            "SELECT 1 FROM saves WHERE post_id=? AND user_key=?",
            (post_id, user_key),
        ).fetchone()

        if existing:
            db.execute(
                "DELETE FROM saves WHERE post_id=? AND user_key=?",
                (post_id, user_key),
            )
            saved = False
        else:
            db.execute(
                "INSERT INTO saves (post_id, user_key) VALUES (?, ?)",
                (post_id, user_key),
            )
            saved = True

    return {"post_id": post_id, "saved": saved}


@app.get("/api/users/{user_id}/saves")
async def get_saves(user_id: str, request: Request):
    """Return all posts saved by this user (identified by IP, v1).

    user_id path param is reserved for future auth — v1 uses the caller's IP
    so the endpoint shape is already correct for Cycle 3 auth migration.
    """
    user_key = (request.client.host if request.client else None) or "anon"

    with _get_db() as db:
        rows = db.execute(
            "SELECT post_id FROM saves WHERE user_key=? ORDER BY created_at DESC",
            (user_key,),
        ).fetchall()

    saved_ids = {row["post_id"] for row in rows}
    saved_posts = [p for p in _posts_cache if p["id"] in saved_ids]
    return {"items": saved_posts, "total": len(saved_posts)}


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Comments — in-memory store (pre-DB, migration-ready)
# { post_id: [ {id, user_key, text, created_at}, ... ] }
# ---------------------------------------------------------------------------

_comments_store: dict = {}


@app.post("/api/posts/{post_id}/comments")
async def add_comment(post_id: str, request: Request):
    body = await request.json()
    text = body.get("text", "").strip()
    if not text or len(text) > 500:
        raise HTTPException(status_code=400, detail="text required, max 500 chars")

    # validate post exists
    if _posts_cache:
        post = next((p for p in _posts_cache if p["id"] == post_id), None)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

    # moderation — direct call to moderate_comment() to avoid HTTP self-call deadlock
    try:
        mod_result = await moderate_comment(CommentModerationRequest(text=text))
        # fallback:true means API key missing — fail-open per SF-003
        if not mod_result.get("fallback", False):
            if mod_result.get("harmful", False):
                severity = mod_result.get("severity", "high")
                logger.warning(
                    "comment_rejected post=%s severity=%s preview=%r",
                    post_id, severity, text[:80],
                )
                raise HTTPException(status_code=400, detail="content rejected")
    except HTTPException:
        raise
    except Exception as e:
        # moderation error — fail-open, log internally
        logger.error("moderation_error post=%s err=%s", post_id, e)

    user_key = (request.client.host if request.client else None) or "anon"
    comment = {
        "id": f"c_{post_id}_{len(_comments_store.get(post_id, []))}",
        "user_key": user_key,
        "text": text,
        "created_at": __import__("datetime").datetime.utcnow().isoformat(),
    }
    _comments_store.setdefault(post_id, []).append(comment)
    logger.info("comment_added post=%s id=%s", post_id, comment["id"])
    return comment


@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 20, offset: int = 0):
    comments = _comments_store.get(post_id, [])
    return {
        "items": comments[offset: offset + limit],
        "total": len(comments),
    }


# ---------------------------------------------------------------------------
# In-memory notifications store
# Structure: { user_id: [ {id, type, from_user_key, post_id, created_at, read}, ... ] }
# SF-004: _emit_notification is called directly (NOT via HTTP) to avoid ASGI deadlock.
# ---------------------------------------------------------------------------

_notifications_store: dict = {}


def _emit_notification(user_id: str, notif_type: str, from_key: str, post_id: str = None):
    """Internal helper — call directly from other endpoints (NOT via HTTP — SF-004)."""
    import datetime
    if not user_id:
        # No owner to notify — skip silently.
        return
    notif = {
        "id": f"n_{user_id}_{len(_notifications_store.get(user_id, []))}",
        "type": notif_type,        # "like" | "comment" | "follow"
        "from_user_key": from_key,
        "post_id": post_id,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "read": False,
    }
    _notifications_store.setdefault(user_id, []).append(notif)
    logger.info(
        "notification emitted: user=%s type=%s from=%s post=%s",
        user_id, notif_type, from_key, post_id,
    )


@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = 20, unread_only: bool = False):
    """Return recent notifications for a user, newest first."""
    notifs = _notifications_store.get(user_id, [])
    if unread_only:
        notifs = [n for n in notifs if not n["read"]]
    return {
        "items": notifs[-limit:][::-1],
        "total": len(notifs),
        "unread": sum(1 for n in notifs if not n["read"]),
    }


@app.post("/api/notifications/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user."""
    for n in _notifications_store.get(user_id, []):
        n["read"] = True
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth — users table in SQLite (Cycle 2).
#
# Passwords: SHA-256 hash (NOT bcrypt yet — Cycle 3 will upgrade to bcrypt).
# Tokens: user_id as placeholder token (NO JWT yet — Cycle 3).
# Schema owner: Sam. Integration owner: Oren.
# ---------------------------------------------------------------------------

def _pw_hash(password: str) -> str:
    """SHA-256 hash of password. NOT bcrypt — Cycle 3 will upgrade."""
    return hashlib.sha256(password.encode()).hexdigest()


@app.post("/api/auth/register")
async def register(request: Request):
    """Register a new user.

    Required body fields: username, email, password.
    Returns {user_id, token (=user_id placeholder), username}.
    400 if any field missing or password < 6 chars.
    409 if username or email already exists.
    """
    body = await request.json()
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not username or not email or not password:
        raise HTTPException(status_code=400, detail="username, email, password required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="password must be at least 6 characters")

    user_id = f"user_{username}_{int(time.time())}"
    pw_hash = _pw_hash(password)

    with _get_db() as db:
        try:
            db.execute(
                """
                INSERT INTO users (id, username, email, password_hash, display_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, username, email, pw_hash, username, time.time()),
            )
        except Exception as exc:
            # sqlite3.IntegrityError: UNIQUE constraint failed
            if "UNIQUE" in str(exc) or "IntegrityError" in type(exc).__name__:
                raise HTTPException(status_code=409, detail="username or email already exists")
            raise

    logger.info("New user registered: %s (%s)", user_id, username)
    return {"user_id": user_id, "token": user_id, "username": username}


@app.post("/api/auth/login")
async def login(request: Request):
    """Authenticate a user by email + password.

    Returns {user_id, token (=user_id placeholder), username}.
    401 if credentials are invalid.
    """
    body = await request.json()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    pw_hash = _pw_hash(password)

    with _get_db() as db:
        row = db.execute(
            "SELECT id, username FROM users WHERE email=? AND password_hash=?",
            (email, pw_hash),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="invalid credentials")

    logger.info("User login: %s", row[0])
    return {"user_id": row[0], "token": row[0], "username": row[1]}


@app.get("/api/auth/me/{user_id}")
async def get_me(user_id: str):
    """Return the full user object for user_id. 404 if not found."""
    with _get_db() as db:
        row = db.execute(
            "SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users WHERE id=?",
            (user_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


@app.patch("/api/auth/me/{user_id}")
async def update_me(user_id: str, request: Request):
    """Update allowed profile fields for user_id.

    Allowed fields: display_name (≤50 chars), bio (≤150 chars), avatar_url (≤500 chars).
    Unknown fields are silently ignored.
    Returns {user_id, updated: [field_names]}.
    400 if no valid fields provided.
    """
    body = await request.json()
    fields = {}
    if "display_name" in body:
        fields["display_name"] = str(body["display_name"])[:50]
    if "bio" in body:
        fields["bio"] = str(body["bio"])[:150]
    if "avatar_url" in body:
        fields["avatar_url"] = str(body["avatar_url"])[:500]

    if not fields:
        raise HTTPException(status_code=400, detail="no valid fields to update")

    set_clause = ", ".join(f"{k}=?" for k in fields)
    with _get_db() as db:
        db.execute(
            f"UPDATE users SET {set_clause} WHERE id=?",
            (*fields.values(), user_id),
        )

    logger.info("User updated: %s — fields: %s", user_id, list(fields.keys()))
    return {"user_id": user_id, "updated": list(fields.keys())}


# ---------------------------------------------------------------------------
# Marketplace Filter Assistant — AI-powered item matching
# ---------------------------------------------------------------------------

@app.post("/api/marketplace/assist")
async def marketplace_assist(request: Request, body: dict = Body(...)):
    """AI-powered marketplace filter: ranks items against user query + wardrobe context.

    Input body:
      query    — free-text user intent (required)
      wardrobe — list of user's closet items (optional, capped at 15)
      items    — marketplace items to rank (optional, capped at 20)

    Returns:
      matches  — list of {id, score (0-100), reason} sorted descending by score
      message  — friendly summary in the same language as the query
    """
    user_key = (request.client.host if request.client else None) or "anon"

    if not check_rate_limit(user_key, "marketplace_assist", 20):
        logger.warning("Rate limit exceeded: marketplace_assist from %s", user_key)
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")

    query: str = (body.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    wardrobe: list = body.get("wardrobe") or []
    items: list = body.get("items") or []

    # -----------------------------------------------------------------------
    # Demo fallback — keyword-based matching when Claude is unavailable
    # -----------------------------------------------------------------------
    def _demo_fallback() -> dict:
        keyword_map = {
            "date":    ["dress", "top", "outerwear"],
            "casual":  ["top", "bottoms"],
            "party":   ["dress", "outerwear"],
            "work":    ["tops", "bottoms", "outerwear"],
            "beach":   ["swimwear", "tops", "bottoms"],
            "formal":  ["dress", "outerwear"],
        }
        query_lower = query.lower()
        target_cats: list[str] = []
        for kw, cats in keyword_map.items():
            if kw in query_lower:
                target_cats.extend(cats)

        matches = []
        for item in items[:20]:
            item_cat = (item.get("category") or "").lower()
            if not target_cats or any(c in item_cat for c in target_cats):
                matches.append({
                    "id": item.get("id", ""),
                    "score": 75,
                    "reason": "matches your style request",
                })
        matches = matches[:6]
        return {
            "matches": matches,
            "message": f"Found {len(matches)} items that may suit your request.",
            "demo": True,
        }

    # -----------------------------------------------------------------------
    # Claude call
    # -----------------------------------------------------------------------
    system = (
        "You are AWEAR's fashion AI. The user has a personal wardrobe and is shopping. "
        "Given their query and wardrobe context, identify which marketplace items best match. "
        "Return JSON only: "
        '{"matches": [{"id": "...", "score": 0-100, "reason": "one short sentence"}], '
        '"message": "friendly summary in same language as query"} '
        "Items with score 0 should be excluded."
    )
    user_msg = (
        f"User query: {query}\n\n"
        f"Their wardrobe items: {json.dumps(wardrobe[:15], ensure_ascii=False)}\n\n"
        f"Available marketplace items: {json.dumps(items[:20], ensure_ascii=False)}\n\n"
        "Match items to the query considering: occasion, style compatibility with wardrobe, "
        "colors, categories."
    )

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = response.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:]).rstrip("`").strip()
        parsed = json.loads(raw)

        matches = [
            m for m in parsed.get("matches", [])
            if isinstance(m, dict) and int(m.get("score", 0)) > 0
        ]
        matches.sort(key=lambda m: int(m.get("score", 0)), reverse=True)

        logger.info(
            "marketplace_assist: query=%r user=%s items_in=%d matches=%d",
            query, user_key, len(items), len(matches),
        )
        return {
            "matches": matches,
            "message": parsed.get("message", f"Found {len(matches)} matching items."),
        }
    except Exception as e:
        logger.warning("marketplace_assist Claude error (%s) — using demo fallback", e)
        return _demo_fallback()


app.mount("/static", StaticFiles(directory="static"), name="static")
