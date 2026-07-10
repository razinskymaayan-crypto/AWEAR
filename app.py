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
import hmac
import io
import json
import logging
import os
import secrets
import sqlite3
import uuid
import time
import traceback
import asyncio
import urllib.error
import urllib.parse
import urllib.request
import warnings
from collections import defaultdict
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

import anthropic
import bcrypt
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

# ---------------------------------------------------------------------------
# Weather cache — in-memory, keyed by rounded (lat, lon), TTL 30 minutes
# ---------------------------------------------------------------------------
_weather_cache: dict[str, tuple[float, dict]] = {}  # key -> (timestamp, payload)
WEATHER_CACHE_TTL = 1800  # 30 minutes in seconds


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


def check_rate_limit_window(client_ip: str, endpoint: str, limit: int, window: int) -> bool:
    """Sliding-window rate limiter with a custom time window (seconds).

    Identical logic to check_rate_limit but uses an explicit `window` parameter
    instead of the global RATE_WINDOW — useful for per-hour or per-day limits.
    """
    key = f"{client_ip}:{endpoint}"
    now = time.time()
    _rate_store[key] = [t for t in _rate_store[key] if now - t < window]
    if len(_rate_store[key]) >= limit:
        return False
    _rate_store[key].append(now)
    return True


# Points awarded per challenge type
CHALLENGE_POINTS: dict[str, int] = {
    "scan":      20,
    "diary":     10,
    "swipe":     15,
    "sell":      25,
    "streak":    30,
    "share":     10,
}
CHALLENGE_POINTS_DEFAULT = 10  # fallback for unknown challenge IDs

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

# Diagnostics-only holder for the LAST /api/analyze outcome. Lets the founder SEE
# (via GET /api/scan-health) whether the real scan ran ("live") or fell back to the
# demo, and WHY — distinguishing "no key configured" from "key present but the call
# failed". Bounded values only; never holds raw exception text or any key material.
_last_scan: dict = {"mode": None, "demo_reason": None}


def _classify_api_error(e: Exception) -> str:
    """Map an Anthropic call failure to a bounded enum — never raw exception text.

    Returns one of: "auth" | "rate_limit" | "timeout" | "parse" | "sdk_shape" |
    "unknown". The getattr(...) guards keep this safe if the installed SDK lacks a
    given exception class (older/newer anthropic than requirements pins). Used by
    /api/analyze (prefixed "api_error:") and the /api/scan-health probe so a key
    holder can SEE *why* a live call failed without leaking secrets.
    """
    auth_err = getattr(anthropic, "AuthenticationError", ())
    rate_err = getattr(anthropic, "RateLimitError", ())
    timeout_err = getattr(anthropic, "APITimeoutError", ())
    if auth_err and isinstance(e, auth_err):
        return "auth"
    if rate_err and isinstance(e, rate_err):
        return "rate_limit"
    if timeout_err and isinstance(e, timeout_err):
        return "timeout"
    if isinstance(e, ValueError) and str(e) == "empty parse":
        return "parse"
    # Catch-all for any AttributeError. Primary case: an older installed SDK lacks
    # client.messages.parse (parse is beta-only there). Also covers a response of an
    # unexpected shape (e.g. .parsed_output access after an SDK change). Either way it
    # signals "SDK surface mismatch" — check the installed anthropic version vs
    # requirements (>=0.109).
    if isinstance(e, AttributeError):
        return "sdk_shape"
    return "unknown"


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
CREATOR_CREDIT_PCT = 0.05   # creator earns 5% of order amount_usd. LOCKED economics — do not change.
ORDER_DEDUP_WINDOW_SEC = 15  # collapse double-fired orders that carry no client_ref (legacy path defense)
PRELOVED_COMMISSION_PCT = 0.08  # AWEAR's commission on a preloved (P2P second-hand) deal

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
             "resale_potential": "medium", "search_query": "white ribbed cropped sleeveless tank top women", "price_estimate_usd": 25,
             "image_url": "https://image.hm.com/assets/hm/59/12/591234ce7947b24f9bbb9ce0abf536e0d0551563.jpg"},
            {"category": "bottoms", "name": "Barrel-Leg Light Wash Denim", "color": "light blue",
             "material_guess": "denim", "brand_vibe": "Levi's",
             "style_tags": ["denim", "y2k", "casual"], "resale_potential": "high",
             "search_query": "barrel leg light wash jeans women", "price_estimate_usd": 80,
             "image_url": "https://n.nordstrommedia.com/it/15963ac9-5f3f-4207-b119-a021e1db52e7.jpeg?h=368&w=240&dpr=2"},
            {"category": "shoes", "name": "Adidas Samba OG White", "color": "white/black",
             "material_guess": "leather", "brand_vibe": "Adidas",
             "style_tags": ["retro", "sporty", "iconic"], "resale_potential": "high",
             "search_query": "adidas samba og white black sneakers", "price_estimate_usd": 120,
             "image_url": "https://assets.adidas.com/images/w_1880,f_auto,q_auto/c68f09963c6e47dcad68ac010115a208_9366/Stan_Smith_Shoes_White_FX5500_01_standard.jpg"},
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
             "search_query": "oversized camel blazer women wool", "price_estimate_usd": 150,
             "image_url": "https://static.zara.net/assets/public/9885/e922/a0be46659e56/661cb395b150/08769916400-p/08769916400-p.jpg"},
            {"category": "bottoms", "name": "Straight-Leg Black Trousers", "color": "black",
             "material_guess": "polyester blend", "brand_vibe": "COS",
             "style_tags": ["minimal", "office", "classic"], "resale_potential": "medium",
             "search_query": "straight leg black tailored trousers women", "price_estimate_usd": 70,
             "image_url": "https://n.nordstrommedia.com/it/742c046e-df5e-4844-95b4-61e1096c97ed.jpeg?crop=pad&pad_color=FFF&format=jpeg&trim=color&trimcolor=FFF&w=780&h=1196"},
            {"category": "shoes", "name": "Pointed-Toe Leather Mules", "color": "black",
             "material_guess": "leather", "brand_vibe": "Mango",
             "style_tags": ["minimal", "elegant"], "resale_potential": "medium",
             "search_query": "pointed toe black leather mules women", "price_estimate_usd": 60,
             "image_url": "https://cdn.shopify.com/s/files/1/0610/1440/9428/files/10MM18-VENICE-20118-CASTAN.jpg"},
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
             "search_query": "vintage black band graphic tee oversized", "price_estimate_usd": 35,
             "image_url": "https://images.urbndata.com/is/image/UrbanOutfitters/89759898_049_b?$xlarge$&fit=constrain&qlt=80&wid=614"},
            {"category": "bottoms", "name": "Baggy Cargo Pants Khaki", "color": "khaki",
             "material_guess": "cotton twill", "brand_vibe": "Carhartt",
             "style_tags": ["streetwear", "utility", "y2k"], "resale_potential": "high",
             "search_query": "baggy cargo pants khaki women utility", "price_estimate_usd": 90,
             "image_url": "https://is4.revolveassets.com/images/p4/n/uv/RTAR-WJ45_V1.jpg"},
            {"category": "shoes", "name": "New Balance 550 White Cream", "color": "white/cream",
             "material_guess": "leather", "brand_vibe": "New Balance",
             "style_tags": ["retro", "sporty", "streetwear"], "resale_potential": "high",
             "search_query": "new balance 550 white cream sneakers", "price_estimate_usd": 110,
             "image_url": "https://assets.adidas.com/images/w_1880,f_auto,q_auto/7f58eea8063344908fafb96773b13a1e_9366/Superstar_Shoes_White_EG4958_01_standard.jpg"},
            {"category": "bag", "name": "Mini Crossbody Black Canvas", "color": "black",
             "material_guess": "canvas", "brand_vibe": "streetwear",
             "style_tags": ["streetwear", "everyday"], "resale_potential": "low",
             "search_query": "mini black canvas crossbody bag streetwear", "price_estimate_usd": 30,
             "image_url": "https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87046714_CU_B.jpg?ts=1714729382668"},
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
        parse_args = dict(
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
        # The deploy box may run an older `anthropic` than requirements pins, where
        # structured `messages.parse(...)` lives only under the beta namespace. Try the
        # stable surface first; on AttributeError retry the beta surface with the SAME
        # args. If beta is absent too, AttributeError propagates and classifies as
        # "sdk_shape" (graceful demo, no crash mid-pitch).
        try:
            response = client.messages.parse(**parse_args)
        except AttributeError:
            response = client.beta.messages.parse(
                betas=["structured-outputs-2025-11-13"], **parse_args
            )
        if response.parsed_output is None:
            raise ValueError("empty parse")
        result = response.parsed_output.model_dump()
        result["mode"] = "live"
        result["demo_reason"] = None
    except Exception as e:  # noqa: BLE001 — auth/api/parse failure -> graceful demo fallback
        # Classify the failure into a bounded enum so the founder can SEE whether the
        # real scan fell to demo because no key is configured vs. a live call failure
        # WITH a valid key. Raw exception text never reaches the response.
        if not os.getenv("ANTHROPIC_API_KEY"):
            # Expected config state on a key-less box — not an incident.
            demo_reason = "no_api_key"
            logger.warning("analyze fell to demo: ANTHROPIC_API_KEY not configured")
        else:
            # Key IS present — the founder's exact scenario. Map to a bounded enum and
            # log LOUD (ERROR) with the traceback so the failure is visible in logs.
            demo_reason = "api_error:" + _classify_api_error(e)
            logger.error(
                "analyze fell to demo despite a configured key (%s): %s",
                demo_reason,
                e,
                exc_info=True,
            )
        result = _demo_analysis()
        result["mode"] = "demo"
        result["demo_reason"] = demo_reason

    # Record the last scan outcome for the diagnostics endpoint (GET /api/scan-health).
    _last_scan["mode"] = result["mode"]
    _last_scan["demo_reason"] = result.get("demo_reason")

    # Enrich each item with shoppable buy options + a "shop the whole look" total.
    look_total = 0
    for item in result["items"]:
        item["buy_options"] = build_buy_options(item["search_query"])
        look_total += item.get("price_estimate_usd") or 0
    result["look_total_usd"] = look_total
    return result


@app.get("/api/scan-health")
async def scan_health(request: Request, probe: int = 0):
    """Diagnostics for /api/analyze. Read-only; never returns key material.

    Default (no ``probe``): does NOT call Claude — reports config + the last
    /api/analyze outcome (bounded ``demo_reason``) so the founder can SEE whether
    the real scan is running ("live") or silently falling back to demo, and WHY.

    ``?probe=1``: opt-in liveness check — makes ONE minimal real Claude call to
    confirm the key is actually valid & the API reachable (the config flag only
    says a key STRING is set, not that it works). Results are bounded enums only.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "scan-health", 30):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    result = {
        "key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "model": MODEL,
        "last_analyze_mode": _last_scan["mode"],
        "last_demo_reason": _last_scan["demo_reason"],
        # Populated only when ?probe=1 actually ran a live call; None otherwise.
        "key_valid": None,
        "probe_error": None,
    }

    if not probe:
        return result

    # Opt-in liveness probe: a separate, tighter bucket on top of the 30/min above
    # (a probe consumes BOTH) so the real Claude call can't be hammered.
    if not check_rate_limit_window(user_key, "scan-health-probe", 3, 60):
        raise HTTPException(status_code=429, detail="Probe rate limit exceeded — max 3 requests/minute.")

    if not os.getenv("ANTHROPIC_API_KEY"):
        # No key STRING set — nothing to validate; don't spend a call.
        result["key_valid"] = False
        result["probe_error"] = "no_api_key"
        return result

    try:
        # max_tokens=5 is a deliberate cost ceiling — we only need a successful
        # round-trip to prove credentials + reachability, not real output. Use
        # messages.create (NOT parse): create exists on every SDK version, so a
        # probe failure means credentials/reachability, not SDK shape.
        client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=5,
            messages=[{"role": "user", "content": "ok"}],
        )
        result["key_valid"] = True
        result["probe_error"] = "none"
    except Exception as e:  # noqa: BLE001 — bounded enum out, raw text never leaves the box
        result["key_valid"] = False
        result["probe_error"] = _classify_api_error(e)
        logger.error("scan-health probe failed (%s)", result["probe_error"], exc_info=True)

    return result


# ---------------------------------------------------------------------------
# Product images — proxy to Pexels (best quality) or Unsplash Source (no-key fallback).
# Priority: Pexels (if PEXELS_API_KEY set) → Unsplash Source → 404.
# Results cached in-memory per query.
# ---------------------------------------------------------------------------
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "").strip()
_product_image_cache: dict[str, str] = {}

_UNSPLASH_CATEGORY_MAP = {
    "shoes": "shoes,footwear",
    "sneakers": "sneakers,shoes",
    "boots": "boots,shoes",
    "sandals": "sandals,shoes",
    "loafers": "loafers,shoes",
    "top": "shirt,clothing,fashion",
    "tops": "shirt,clothing,fashion",
    "bottoms": "pants,jeans,clothing",
    "jeans": "jeans,denim",
    "shorts": "shorts,clothing",
    "outerwear": "jacket,coat,fashion",
    "jacket": "jacket,fashion",
    "coat": "coat,fashion",
    "dress": "dress,fashion",
    "accessories": "accessories,fashion",
    "hat": "hat,fashion",
    "bag": "bag,fashion",
}


def _loremflickr_url(q: str) -> str:
    """Keyword-matched real photos via loremflickr, no API key needed."""
    kw = urllib.parse.quote(q[:60].replace(" ", ","))
    seed = sum(ord(c) for c in q) % 9999
    return f"https://loremflickr.com/400/500/fashion,{kw}/all?lock={seed}"


@app.get("/api/product-image")
def product_image(q: str = ""):
    q = (q or "").strip().lower()
    if not q:
        return Response(status_code=404)
    if q not in _product_image_cache:
        url = ""
        if PEXELS_API_KEY:
            try:
                req = urllib.request.Request(
                    "https://api.pexels.com/v1/search?"
                    + urllib.parse.urlencode({"query": q, "per_page": 1, "orientation": "portrait"}),
                    headers={"Authorization": PEXELS_API_KEY},
                )
                with urllib.request.urlopen(req, timeout=5) as r:
                    photos = json.loads(r.read().decode()).get("photos", [])
                url = photos[0]["src"]["large"] if photos else ""
            except Exception:  # noqa: BLE001
                url = ""
        if not url:
            url = _loremflickr_url(q)
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


def _fallback_outfits(wardrobe: list, occasion: str) -> dict:
    """Build 2-3 outfit suggestions server-side from the provided wardrobe.

    Used when the Claude call fails OR returns no usable outfits, so the AI
    Stylist screen is never empty. Mirrors the FE buildFallbackOutfits output
    shape exactly so renderOutfitResults renders it unchanged. Real owned items
    are used where present; missing categories get a generic placeholder with
    _missing=True (the FE turns that into a shoppable suggestion).
    """
    wardrobe = wardrobe or []

    def _by_cat(*cats: str) -> list:
        return [
            it for it in wardrobe
            if isinstance(it, dict) and (it.get("category") or "").lower() in cats
        ]

    tops = _by_cat("top")
    bottoms = _by_cat("bottoms", "dress")
    shoes = _by_cat("shoes")
    bags = _by_cat("bag")

    occ = (occasion or "").strip().lower()
    # occasion-aware placeholders + tips (non "go buy something" styling tips)
    if any(k in occ for k in ("interview", "work", "office", "business")):
        tip = "Keep it clean and structured — a tucked-in top and one quiet accessory read as polished."
        ph_top, ph_bottom, ph_shoe, ph_bag = "White button-up", "Tailored trousers", "Classic loafers", "Structured tote"
    elif any(k in occ for k in ("date", "dinner", "romant")):
        tip = "Let one piece do the talking and keep the rest soft — confidence is the real accessory."
        ph_top, ph_bottom, ph_shoe, ph_bag = "Silk blouse", "Midi skirt", "Low heel", "Small shoulder bag"
    elif any(k in occ for k in ("workout", "gym", "sport", "run")):
        tip = "Match your top and bottom tones so the look stays sharp even mid-workout."
        ph_top, ph_bottom, ph_shoe, ph_bag = "Sport crop top", "Leggings", "Training sneakers", "Compact gym bag"
    elif any(k in occ for k in ("party", "night", "club", "festive")):
        tip = "Go monochrome and let texture or shine carry the drama for the evening."
        ph_top, ph_bottom, ph_shoe, ph_bag = "Statement top", "Black trousers", "Heeled boots", "Mini clutch"
    elif any(k in occ for k in ("beach", "vacation", "summer", "holiday")):
        tip = "Breathable layers in light tones keep the look easy and the day comfortable."
        ph_top, ph_bottom, ph_shoe, ph_bag = "Linen shirt", "Flowy skirt", "Leather sandals", "Straw tote"
    else:
        tip = "Mix neutral basics with one statement piece — that contrast is what makes a look intentional."
        ph_top, ph_bottom, ph_shoe, ph_bag = "Basic top", "Matching bottoms", "Everyday shoes", "Day bag"

    def _real(it: dict, category: str) -> dict:
        return {"name": it.get("name") or "Item", "category": category, "_missing": False}

    def _ph(name: str, category: str) -> dict:
        return {"name": name, "category": category, "_missing": True}

    def _pick(pool: list, idx: int, ph_name: str, category: str) -> dict:
        if pool:
            it = pool[idx % len(pool)]
            return _real(it, (it.get("category") or category).lower())
        return _ph(ph_name, category)

    # Number of looks: 3 when we have variety, otherwise 2 (1-2 starter looks if empty).
    look_names = ["The everyday edit", "Off-duty look", "Statement version"]
    n = 3 if (len(tops) >= 2 or len(bottoms) >= 2) else 2

    outfits: list = []
    for i in range(n):
        items = [
            _pick(tops, i, ph_top, "top"),
            _pick(bottoms, i, ph_bottom, "bottoms"),
            _pick(shoes, i, ph_shoe, "shoes"),
            _pick(bags, i, ph_bag, "bag"),
        ]
        owned = sum(1 for it in items if not it["_missing"])
        # honest match: more owned items => higher score (62 base, +9 per owned, capped 94)
        match_pct = min(94, 62 + owned * 9)
        outfits.append({
            "name": look_names[i] if i < len(look_names) else f"Look {i + 1}",
            "match_pct": match_pct,
            "tip": tip,
            "items": items,
        })

    return {"outfits": outfits}


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
        result = json.loads(text)
        # Guard junk/empty model replies: if no usable outfits, fall back so the
        # screen is never empty (missing key, not a list, or empty list).
        if not isinstance(result, dict) or not isinstance(result.get("outfits"), list) or not result["outfits"]:
            return _fallback_outfits(data.wardrobe, data.occasion)
        return result
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
        return _fallback_outfits(data.wardrobe, data.occasion)


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
        return {"answer": response.content[0].text, "ok": True}
    except Exception as e:
        print(f"[ERROR] {e}\n{traceback.format_exc()}", flush=True)
        # Demo reliability (A6): signal unavailability so the client falls through
        # to its local stylist replies instead of rendering a broken message.
        return {"ok": False}


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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token      TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                created_at REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS challenge_completions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key    TEXT    NOT NULL,
                challenge_id TEXT   NOT NULL,
                date        TEXT    NOT NULL DEFAULT (date('now')),
                points      INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT    DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS wardrobe_wears (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key   TEXT NOT NULL,
                item_id    TEXT NOT NULL,
                worn_date  TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stylist_bookings (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key     TEXT NOT NULL,
                stylist_id   TEXT NOT NULL,
                stylist_name TEXT NOT NULL,
                session_type TEXT NOT NULL,
                slot_label   TEXT NOT NULL,
                booked_at    TEXT DEFAULT (datetime('now')),
                status       TEXT DEFAULT 'confirmed'
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS wishlist (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key   TEXT NOT NULL,
                item_id    TEXT NOT NULL,
                item_type  TEXT NOT NULL DEFAULT 'marketplace',
                item_data  TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_key, item_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS wear_log (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key      TEXT NOT NULL,
                item_id       TEXT NOT NULL,
                item_name     TEXT,
                worn_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                style_tags    TEXT,
                color_primary TEXT,
                occasion      TEXT,
                material_guess TEXT
            )
        """)
        # Migrate existing wear_log rows — SQLite ALTER TABLE doesn't support IF NOT EXISTS
        for _col in ['color_primary TEXT', 'occasion TEXT', 'material_guess TEXT']:
            try:
                conn.execute(f'ALTER TABLE wear_log ADD COLUMN {_col}')
            except sqlite3.OperationalError:
                # Column already exists (SQLite lacks ADD COLUMN IF NOT EXISTS) — expected
                # on re-init, safe to skip. Any OTHER error (locked/corrupt DB) still surfaces.
                pass
        conn.execute("""
            CREATE TABLE IF NOT EXISTS season_summaries (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key     TEXT NOT NULL,
                season       TEXT NOT NULL,
                year         INTEGER NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                summary_json TEXT NOT NULL,
                UNIQUE(user_key, season, year)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id           TEXT PRIMARY KEY,
                user_key     TEXT NOT NULL,
                post_id      TEXT DEFAULT '',
                product_id   TEXT DEFAULT '',
                product_name TEXT NOT NULL,
                amount_usd   REAL DEFAULT 0,
                status       TEXT DEFAULT 'completed',
                influencer_id TEXT DEFAULT '',
                client_ref   TEXT DEFAULT '',
                created_at   TEXT NOT NULL
            )
        """)
        # Additive migration: client_ref idempotency key. Guarded — existing DBs
        # already have the orders table; ALTER adds the column without touching rows.
        cols = {r[1] for r in conn.execute("PRAGMA table_info(orders)").fetchall()}
        if "client_ref" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN client_ref TEXT DEFAULT ''")
        # Additive migration: preloved/retail facade columns. The live orders table
        # records every in-app purchase (retail dropshipping/affiliate facade). For
        # preloved (P2P second-hand) we also record the counterparty (seller_key) and
        # AWEAR's 8% commission. Existing rows default to retail / no seller / 0 commission,
        # preserving the live POST contract and the Creator-Wallet credit flow unchanged.
        if "kind" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN kind TEXT DEFAULT 'retail'")
        if "seller_key" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN seller_key TEXT DEFAULT ''")
        if "commission_usd" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN commission_usd REAL DEFAULT 0")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_orders_userkey_ref "
            "ON orders (user_key, client_ref)"
        )
        # Supports the legacy (empty client_ref) natural-key dedup lookup in
        # create_order: filter by user_key, then time-window on created_at.
        # Additive, non-unique — never blocks an insert.
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_orders_userkey_created "
            "ON orders (user_key, created_at)"
        )
        conn.execute("""
            CREATE TABLE IF NOT EXISTS credits (
                id           TEXT PRIMARY KEY,
                user_key     TEXT NOT NULL,
                order_id     TEXT NOT NULL,
                item_name    TEXT DEFAULT '',
                amount_usd   REAL DEFAULT 0,
                type         TEXT DEFAULT 'creator',
                created_at   TEXT NOT NULL
            )
        """)
        # Direct messages between users. owner_key = the MG-005 user_key ("me").
        # peer_id = the other party (a seed user id). direction: 'out' = me->peer,
        # 'in' = peer->me. read = whether an inbound message has been seen by me.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS dm_messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_key  TEXT NOT NULL,
                peer_id    TEXT NOT NULL,
                direction  TEXT NOT NULL,
                text       TEXT NOT NULL,
                created_at TEXT NOT NULL,
                read       INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_dm_owner_peer_created
            ON dm_messages (owner_key, peer_id, created_at)
        """)
        # Daily documentation — private style journal + streak (Duolingo-style).
        # One row per (user_key, log_date); re-logging a date upserts in place.
        # items_json = JSON array of item ids/names. is_private default 1 (private).
        conn.execute("""
            CREATE TABLE IF NOT EXISTS daily_logs (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key   TEXT NOT NULL,
                log_date   TEXT NOT NULL,
                items_json TEXT NOT NULL DEFAULT '[]',
                note       TEXT DEFAULT '',
                is_private INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                UNIQUE(user_key, log_date)
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date "
            "ON daily_logs (user_key, log_date)"
        )
        # Ephemeral 24h stories (outfit-of-the-day). A story is "active" while
        # created_at is within the last 24h; GET filters expired ones in SQL.
        # created_at stored as datetime.utcnow().isoformat() (UTC, same as orders).
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_key   TEXT NOT NULL,
                image_url  TEXT NOT NULL,
                caption    TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_stories_created "
            "ON stories (created_at)"
        )
        # Intelligence base — the compounding store the Scout agent writes to.
        # Source of truth for dedup ("what do we already know about X") + queryable
        # ranking of insights harvested from the web. Markdown syntheses live in
        # docs/research/ and link back here via doc_path. See .claude/agents/scout.md.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS intel_insights (
                id           TEXT PRIMARY KEY,              -- INS-YYYYMMDD-nnn
                topic        TEXT NOT NULL,                 -- normalized slug for dedup
                source_type  TEXT NOT NULL,                 -- competitor|trend|pricing|social|tech_ux|other
                source_url   TEXT DEFAULT '',
                title        TEXT NOT NULL,
                summary      TEXT NOT NULL,                 -- 1-3 sentence claim
                evidence     TEXT DEFAULT '',               -- quotes / data points
                loop_stage   TEXT DEFAULT '',               -- SCAN|MATCH|LOOKS|BUY|EARN|''
                confidence   INTEGER DEFAULT 3,             -- 1-5
                impact       INTEGER DEFAULT 3,             -- 1-5 (potential value to AWEAR)
                effort       INTEGER DEFAULT 3,             -- 1-5 (to act on)
                status       TEXT DEFAULT 'new',            -- new|deliberating|acted|escalated|parked|superseded
                proposal     TEXT DEFAULT '',               -- recommended action, if any
                doc_path     TEXT DEFAULT '',               -- link to markdown synthesis
                created_by   TEXT DEFAULT 'scout',
                created_at   TEXT DEFAULT (datetime('now')),
                updated_at   TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_intel_topic ON intel_insights (topic)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_intel_status ON intel_insights (status)"
        )
        # Comments on posts (BE-005: persisted from day 1, was an in-memory dict).
        # id format c_{post_id}_{n} — n is the per-post comment count at insert time
        # (matches the old in-memory id scheme; see add_comment()).
        conn.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id         TEXT PRIMARY KEY,
                post_id    TEXT NOT NULL,
                user_key   TEXT NOT NULL,
                text       TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id)"
        )
        # Notifications (BE-005: persisted from day 1, was an in-memory dict).
        # id format n_{user_id}_{n} — n is the per-user notification count at insert
        # time (matches the old in-memory id scheme; see _emit_notification()).
        # "read" is a SQL keyword-adjacent name but is used unquoted elsewhere in this
        # file (dm_messages.read) and works fine as a bare column name in SQLite.
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id            TEXT PRIMARY KEY,
                user_id       TEXT NOT NULL,
                type          TEXT NOT NULL,
                from_user_key TEXT,
                post_id       TEXT,
                created_at    TEXT NOT NULL,
                read          INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)"
        )
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


# ---------------------------------------------------------------------------
# Buy routing — the SINGLE place the app asks "how do I buy this item?".
# Returns the route behind the one-tap Buy button: source + checkout path +
# affiliate buy_url, and a status of exact | similar | archive (the discontinued-
# item chain from docs/PRODUCTIONIZATION.md). Simulated today (affiliate path +
# catalog match); to go live, populate IN_APP_RETAILERS / wire a real network key
# into affiliate_url() — nothing else in the app needs to change.
# ---------------------------------------------------------------------------

# Retailers we can fulfill IN-APP (dropship / universal-checkout API). Empty until a
# real supplier/aggregator contract+key is wired; then those products route to the
# one-tap in-app checkout and everything else falls back to an affiliate redirect.
IN_APP_RETAILERS: set[str] = set()


def _match_score(item: dict, p: dict) -> int:
    """Cheap keyword + category match between a wardrobe item and a catalog product."""
    score = 0
    if (item.get("category") or "").lower() and (item.get("category") or "").lower() == (p.get("category") or "").lower():
        score += 3
    q = " ".join(str(item.get(k, "")) for k in ("search_query", "name", "brand", "color")).lower().replace(",", " ")
    hay = (str(p.get("name", "")) + " " + str(p.get("brand", "")) + " " + str(p.get("color", ""))).lower()
    for w in {w for w in q.split() if len(w) >= 3}:
        if w in hay:
            score += 1
    return score


def _buy_route(p: dict) -> dict:
    retailer = (p.get("brand") or "").lower()
    in_app = retailer in IN_APP_RETAILERS
    return {
        "id": p.get("id"),
        "name": p.get("name"),
        "brand": p.get("brand"),
        "price_usd": p.get("price_estimate_usd"),
        "image_url": p.get("image_url"),
        "retailer": p.get("brand"),
        "source": "in_app" if in_app else "affiliate",      # dropship/universal vs affiliate
        "checkout": "in_app" if in_app else "redirect",       # one-tap in-app vs prefilled redirect
        "buy_url": affiliate_url(p.get("product_url") or ""),
    }


@app.get("/api/resolve-product")
def resolve_product(q: str = "", category: str = "", color: str = "", brand: str = ""):
    item = {"search_query": q, "category": category, "color": color, "brand": brand}
    scored = sorted(((_match_score(item, p), p) for p in _products_cache), key=lambda t: t[0], reverse=True)
    if scored and scored[0][0] >= 3:
        route = _buy_route(scored[0][1])
        route["status"] = "exact"
        return route
    sims = [p for s, p in scored[:8] if s > 0][:4]
    if sims:
        return {"status": "similar", "checkout": "redirect", "source": "affiliate",
                "alternatives": [_buy_route(p) for p in sims]}
    # discontinued / nothing matches: never a dead end — own it, style it, resell it
    return {"status": "archive", "source": "none", "checkout": "none", "alternatives": [],
            "message": "Not sold new anymore — keep it in your closet, style it, or list it for resale."}


@app.post("/api/admin/reload-products")
def admin_reload_products():
    """Hot-reload products.json into the in-memory cache without server restart."""
    global _products_cache
    if PRODUCTS_PATH.exists():
        with open(PRODUCTS_PATH) as f:
            _products_cache = json.load(f)
    return {"status": "ok", "count": len(_products_cache)}


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
# Comments — SQLite (BE-005: persisted from day 1, migrated off the old
# in-memory dict). Table: comments (id, post_id, user_key, text, created_at).
# ---------------------------------------------------------------------------


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
    with _get_db() as db:
        count = db.execute(
            "SELECT COUNT(*) FROM comments WHERE post_id = ?", (post_id,)
        ).fetchone()[0]
        comment = {
            "id": f"c_{post_id}_{count}",
            "user_key": user_key,
            "text": text,
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
        }
        db.execute(
            "INSERT INTO comments (id, post_id, user_key, text, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (comment["id"], post_id, comment["user_key"], comment["text"], comment["created_at"]),
        )
        db.commit()
    logger.info("comment_added post=%s id=%s", post_id, comment["id"])
    return comment


@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 20, offset: int = 0):
    with _get_db() as db:
        rows = db.execute(
            "SELECT id, user_key, text, created_at FROM comments "
            "WHERE post_id = ? ORDER BY created_at ASC, rowid ASC LIMIT ? OFFSET ?",
            (post_id, limit, offset),
        ).fetchall()
        total = db.execute(
            "SELECT COUNT(*) FROM comments WHERE post_id = ?", (post_id,)
        ).fetchone()[0]
    return {
        "items": [dict(r) for r in rows],
        "total": total,
    }


# ---------------------------------------------------------------------------
# Daily documentation — private style journal + Duolingo-style streak.
# Persisted in SQLite daily_logs (BE-005). Per-user scoping via MG-005 user_key.
# One row per (user_key, log_date); POST upserts so re-logging a date overwrites.
# ---------------------------------------------------------------------------


def _compute_streak(dates: list) -> dict:
    """Compute streak stats from a list of YYYY-MM-DD log_date strings.

    current_streak: consecutive calendar days ending today OR yesterday
                    (yesterday-anchored so a not-yet-logged today doesn't
                    zero out an active streak). 0 if the most recent log is
                    older than yesterday.
    best_streak:    longest run of consecutive calendar days ever.
    logged_today:   whether today's date is present.
    """
    today = datetime.date.today()
    # Unique, parsed, valid dates only.
    parsed = set()
    for d in dates:
        try:
            parsed.add(datetime.date.fromisoformat(d))
        except (ValueError, TypeError):
            continue

    logged_today = today in parsed

    # current_streak: walk back from today (or yesterday) while days are present.
    current_streak = 0
    if parsed:
        if today in parsed:
            cursor = today
        elif (today - datetime.timedelta(days=1)) in parsed:
            cursor = today - datetime.timedelta(days=1)
        else:
            cursor = None
        while cursor is not None and cursor in parsed:
            current_streak += 1
            cursor -= datetime.timedelta(days=1)

    # best_streak: longest consecutive run across all logged dates.
    best_streak = 0
    if parsed:
        ordered = sorted(parsed)
        run = 1
        best_streak = 1
        for i in range(1, len(ordered)):
            if (ordered[i] - ordered[i - 1]).days == 1:
                run += 1
            else:
                run = 1
            best_streak = max(best_streak, run)

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "logged_today": logged_today,
    }


def _daily_log_row_to_dict(row) -> dict:
    """Serialize a daily_logs sqlite Row into the public JSON shape."""
    try:
        items = json.loads(row["items_json"]) if row["items_json"] else []
    except (ValueError, TypeError):
        items = []
    return {
        "id": row["id"],
        "date": row["log_date"],
        "items": items,
        "note": row["note"] or "",
        "private": bool(row["is_private"]),
        "created_at": row["created_at"],
    }


@app.post("/api/daily-log")
async def upsert_daily_log(request: Request):
    """Create or update the current user's style-journal entry for a date.

    Body:
        date:    str  — YYYY-MM-DD (required)
        items:   list — item ids/names (optional, default [])
        note:    str  — free text (optional, default "")
        private: bool — optional, default True

    Returns:
        log:    the saved row {id, date, items, note, private, created_at}
        streak: {current_streak, best_streak, logged_today}
    """
    # MG-005 — per-user scoping.
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "daily-log", 30):
        raise HTTPException(status_code=429, detail="rate limit exceeded")

    body = await request.json()

    log_date = (body.get("date") or "").strip()
    # Validate date format strictly — keeps streak math sound.
    try:
        datetime.date.fromisoformat(log_date)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="date required, format YYYY-MM-DD")

    items = body.get("items", [])
    if not isinstance(items, list):
        raise HTTPException(status_code=400, detail="items must be a list")
    items_json = json.dumps(items)

    note = (body.get("note") or "").strip()
    if len(note) > 2000:
        raise HTTPException(status_code=400, detail="note max 2000 chars")

    # default private=True; only an explicit False makes it non-private.
    is_private = 0 if body.get("private") is False else 1

    now_iso = datetime.datetime.utcnow().isoformat()

    with _get_db() as conn:
        # Upsert on the (user_key, log_date) unique constraint. created_at is
        # preserved on update; items/note/private are overwritten.
        conn.execute(
            """
            INSERT INTO daily_logs
                (user_key, log_date, items_json, note, is_private, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_key, log_date) DO UPDATE SET
                items_json = excluded.items_json,
                note       = excluded.note,
                is_private = excluded.is_private
            """,
            (user_key, log_date, items_json, note, is_private, now_iso),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM daily_logs WHERE user_key = ? AND log_date = ?",
            (user_key, log_date),
        ).fetchone()

        all_dates = [
            r["log_date"]
            for r in conn.execute(
                "SELECT log_date FROM daily_logs WHERE user_key = ?",
                (user_key,),
            ).fetchall()
        ]

    logger.info("daily_log_upsert user=%s date=%s items=%d", user_key, log_date, len(items))
    return {
        "log": _daily_log_row_to_dict(row),
        "streak": _compute_streak(all_dates),
    }


@app.get("/api/daily-log")
async def list_daily_logs(request: Request, limit: int = 60, offset: int = 0):
    """Return the current user's private journal, most-recent date first."""
    user_key = (request.client.host if request.client else None) or "anon"
    limit = max(1, min(limit, 365))
    offset = max(0, offset)

    with _get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM daily_logs
            WHERE user_key = ?
            ORDER BY log_date DESC
            LIMIT ? OFFSET ?
            """,
            (user_key, limit, offset),
        ).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) FROM daily_logs WHERE user_key = ?",
            (user_key,),
        ).fetchone()[0]

    return {
        "items": [_daily_log_row_to_dict(r) for r in rows],
        "total": total,
    }


@app.get("/api/daily-log/streak")
async def daily_log_streak(request: Request):
    """Return streak stats for the current user computed from their log dates."""
    user_key = (request.client.host if request.client else None) or "anon"
    with _get_db() as conn:
        dates = [
            r["log_date"]
            for r in conn.execute(
                "SELECT log_date FROM daily_logs WHERE user_key = ?",
                (user_key,),
            ).fetchall()
        ]
    return _compute_streak(dates)


# ---------------------------------------------------------------------------
# Notifications — SQLite (BE-005: persisted from day 1, migrated off the old
# in-memory dict). Table: notifications (id, user_id, type, from_user_key,
# post_id, created_at, read).
# SF-004: _emit_notification is called directly (NOT via HTTP) to avoid ASGI deadlock.
# ---------------------------------------------------------------------------


def _emit_notification(user_id: str, notif_type: str, from_key: str, post_id: str = None):
    """Internal helper — call directly from other endpoints (NOT via HTTP — SF-004)."""
    import datetime
    if not user_id:
        # No owner to notify — skip silently.
        return
    with _get_db() as db:
        count = db.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ?", (user_id,)
        ).fetchone()[0]
        notif_id = f"n_{user_id}_{count}"
        created_at = datetime.datetime.utcnow().isoformat()
        db.execute(
            "INSERT INTO notifications "
            "(id, user_id, type, from_user_key, post_id, created_at, read) "
            "VALUES (?, ?, ?, ?, ?, ?, 0)",
            (notif_id, user_id, notif_type, from_key, post_id, created_at),
        )
        db.commit()
    logger.info(
        "notification emitted: user=%s type=%s from=%s post=%s",
        user_id, notif_type, from_key, post_id,
    )


@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = 20, unread_only: bool = False):
    """Return recent notifications for a user, newest first."""
    with _get_db() as db:
        query = "SELECT id, type, from_user_key, post_id, created_at, read FROM notifications WHERE user_id = ?"
        params = [user_id]
        if unread_only:
            query += " AND read = 0"
        query += " ORDER BY created_at DESC, rowid DESC LIMIT ?"
        params.append(limit)
        rows = db.execute(query, params).fetchall()

        total = db.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ?", (user_id,)
        ).fetchone()[0]
        unread = db.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read = 0", (user_id,)
        ).fetchone()[0]

    items = [dict(r) for r in rows]
    for item in items:
        item["read"] = bool(item["read"])
    return {
        "items": items,
        "total": total,
        "unread": unread,
    }


@app.post("/api/notifications/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user."""
    with _get_db() as db:
        db.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user_id,))
        db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth — users + sessions tables in SQLite (Cycle 2, hardened Cycle 3, bcrypt
#   migration Cycle 4).
#
# Passwords: bcrypt hash with a per-user salt (`bcrypt.hashpw`/`bcrypt.checkpw`).
#   Legacy rows created before the migration store a plain SHA-256 hex digest
#   (64 chars, no "$2" prefix) — `_pw_verify` detects the format by prefix and
#   verifies against whichever scheme produced the stored hash. A successful
#   legacy login is transparently re-hashed to bcrypt in place (self-healing
#   migration — no bulk backfill needed, no forced password reset).
# Tokens: opaque session tokens (secrets.token_urlsafe(32)) stored in the
#   `sessions` table (SQLite, no in-memory dict — BE-004/BE-005). No TTL/expiry
#   yet — that's a later cycle; today a token is valid until the row is deleted.
# Auth enforcement: `_session_user(request)` resolves the caller's user_id from
#   the `Authorization: Bearer <token>` header. Endpoints that read/write a
#   specific user_id verify caller == user_id (401 no/bad token, 403 mismatch).
# Schema owner: Sam. Integration owner: Oren.
# ---------------------------------------------------------------------------

def _pw_hash(password: str) -> str:
    """bcrypt hash of password with a fresh per-user salt (str for TEXT column).

    bcrypt truncates input at 72 bytes — acceptable for this app, no
    pre-hashing needed (no password field here approaches that length).
    """
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _pw_verify(password: str, stored_hash: str) -> bool:
    """Verify password against stored_hash, supporting both hash schemes.

    - bcrypt hashes always start with "$2" (e.g. $2b$12$...) -> bcrypt.checkpw.
    - Legacy SHA-256 hex digests (pre-migration rows) have no such prefix ->
      constant-time compare against hashlib.sha256(...).hexdigest().
    """
    if not stored_hash:
        return False
    if stored_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(password.encode(), stored_hash.encode())
        except ValueError:
            return False
    legacy_hash = hashlib.sha256(password.encode()).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)


def _issue_token(db: sqlite3.Connection, user_id: str) -> str:
    """Mint a new opaque session token for user_id, persist it, return it."""
    token = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, time.time()),
    )
    return token


def _session_user(request: Request) -> Optional[str]:
    """Resolve the calling user_id from the Authorization: Bearer <token> header.

    Returns None (never raises) if the header is missing, malformed, or the
    token doesn't match a live session — callers decide the HTTP status.
    """
    auth_header = request.headers.get("authorization") or ""
    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None
    with _get_db() as db:
        row = db.execute(
            "SELECT user_id FROM sessions WHERE token=?",
            (token,),
        ).fetchone()
    return row[0] if row else None


@app.post("/api/auth/register")
async def register(request: Request):
    """Register a new user.

    Required body fields: username, email, password.
    Returns {user_id, token (opaque session token), username}.
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
        token = _issue_token(db, user_id)

    logger.info("New user registered: %s (%s)", user_id, username)
    return {"user_id": user_id, "token": token, "username": username}


@app.post("/api/auth/login")
async def login(request: Request):
    """Authenticate a user by email + password.

    Returns {user_id, token (opaque session token), username}.
    401 if credentials are invalid.
    """
    body = await request.json()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    with _get_db() as db:
        row = db.execute(
            "SELECT id, username, password_hash FROM users WHERE email=?",
            (email,),
        ).fetchone()
        if not row or not _pw_verify(password, row[2]):
            raise HTTPException(status_code=401, detail="invalid credentials")
        # Self-healing migration: a successful login against a legacy
        # SHA-256 hash upgrades the stored hash to bcrypt transparently.
        if not row[2].startswith("$2"):
            db.execute(
                "UPDATE users SET password_hash=? WHERE id=?",
                (_pw_hash(password), row[0]),
            )
        token = _issue_token(db, row[0])

    logger.info("User login: %s", row[0])
    return {"user_id": row[0], "token": token, "username": row[1]}


@app.get("/api/auth/me/{user_id}")
async def get_me(user_id: str, request: Request):
    """Return the full user object for user_id.

    Requires Authorization: Bearer <token> for the SAME user_id.
    401 if the token is missing/invalid, 403 if it belongs to another user,
    404 if user_id doesn't exist.
    """
    caller = _session_user(request)
    if caller is None:
        raise HTTPException(status_code=401, detail="missing or invalid token")
    if caller != user_id:
        raise HTTPException(status_code=403, detail="forbidden")

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

    Requires Authorization: Bearer <token> for the SAME user_id.
    401 if the token is missing/invalid, 403 if it belongs to another user.
    Allowed fields: display_name (≤50 chars), bio (≤150 chars), avatar_url (≤500 chars).
    Unknown fields are silently ignored.
    Returns {user_id, updated: [field_names]}.
    400 if no valid fields provided.
    """
    caller = _session_user(request)
    if caller is None:
        raise HTTPException(status_code=401, detail="missing or invalid token")
    if caller != user_id:
        raise HTTPException(status_code=403, detail="forbidden")

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


# ---------------------------------------------------------------------------
# GET /api/weather — server-side proxy + 30-minute in-memory cache
# ---------------------------------------------------------------------------

def _fetch_weather_sync(lat: float, lon: float) -> dict:
    """Synchronous HTTP call to open-meteo. Run via asyncio.to_thread() — never
    call this directly inside an async endpoint (SF-004 / iron rule)."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current_weather=true"
        "&hourly=apparent_temperature"
        "&daily=precipitation_probability_max"
        "&timezone=auto"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "AWEAR/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


@app.get("/api/weather")
async def get_weather(request: Request, lat: float, lon: float):
    """Proxy to open-meteo with 30-minute server-side cache per lat/lon pair.

    Rounds lat/lon to 2 decimal places so nearby requests share the same cache
    entry (~1.1 km granularity — sufficient for weather data).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "weather", 60):
        logger.warning("Rate limit exceeded: weather from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    cache_key = f"{lat:.2f},{lon:.2f}"
    now = time.time()
    cached = _weather_cache.get(cache_key)
    if cached is not None:
        cached_at, payload = cached
        if now - cached_at < WEATHER_CACHE_TTL:
            logger.info("weather cache hit: %s (age=%.0fs)", cache_key, now - cached_at)
            return payload

    # Cache miss — fetch from open-meteo in a thread (must not block the event loop)
    try:
        data = await asyncio.to_thread(_fetch_weather_sync, round(lat, 2), round(lon, 2))
    except urllib.error.URLError as exc:
        logger.error("weather fetch failed: %s", exc)
        raise HTTPException(status_code=502, detail="Weather service unavailable.")
    except Exception as exc:
        logger.error("weather unexpected error: %s", exc)
        raise HTTPException(status_code=502, detail="Weather service error.")

    _weather_cache[cache_key] = (now, data)
    logger.info("weather cache miss: %s — fetched and cached", cache_key)
    return data


# ---------------------------------------------------------------------------
# GET /api/analytics/wardrobe — server-side computation from client-sent wardrobe
# ---------------------------------------------------------------------------

@app.get("/api/analytics/wardrobe")
async def analytics_wardrobe(
    request: Request,
    wardrobe: Optional[str] = None,
    range: Optional[str] = None,
):
    """Compute wardrobe analytics from a base64-encoded JSON wardrobe array.

    The wardrobe lives in the client's localStorage — this endpoint accepts it
    as a base64 query param, computes the stats server-side, and returns the
    result. No wardrobe data is persisted on the server.

    Optional ?range=week|month|all controls the wear-activity window used for
    utilization rate and dead-stock detection.  Default (no param or 'all') =
    all-time behaviour matching the original implementation.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_wardrobe", 60):
        logger.warning("Rate limit exceeded: analytics_wardrobe from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    # Validate range param
    valid_ranges = {None, "week", "month", "all"}
    if range not in valid_ranges:
        raise HTTPException(
            status_code=400,
            detail="Invalid range — accepted values: week, month, all.",
        )

    if not wardrobe:
        raise HTTPException(status_code=400, detail="Missing required query param: wardrobe (base64 JSON).")

    # Decode base64 → JSON array
    try:
        decoded = base64.b64decode(wardrobe + "==").decode("utf-8")  # pad for safety
        items: list[dict] = json.loads(decoded)
        if not isinstance(items, list):
            raise ValueError("wardrobe must be a JSON array")
    except Exception as exc:
        logger.warning("analytics_wardrobe decode error from %s: %s", user_key, exc)
        raise HTTPException(status_code=400, detail=f"Invalid wardrobe payload: {exc}")

    total = len(items)
    if total == 0:
        return {
            "utilization_rate": 0,
            "avg_cpw": 0.0,
            "color_distribution": [],
            "category_distribution": [],
            "most_worn": None,
            "dead_stock": [],
            "range": range or "all",
        }

    now_ts = datetime.datetime.utcnow()

    # Determine the activity window based on ?range
    if range == "week":
        window_days = 7
    elif range == "month":
        window_days = 30
    else:
        # "all" or None — keep historical behaviour (30-day utilisation window)
        window_days = 30

    cutoff_30d = now_ts - datetime.timedelta(days=window_days)
    cutoff_dead = now_ts - datetime.timedelta(days=window_days)  # unworn threshold for dead-stock

    # --- utilization rate: items with at least 1 wear in the last 30 days ---
    worn_30d = 0
    total_cpw = 0.0
    cpw_count = 0
    most_worn_item = None
    most_worn_count = 0
    dead_stock: list[dict] = []

    color_counts: dict[str, int] = defaultdict(int)
    category_counts: dict[str, int] = defaultdict(int)

    for item in items:
        name = item.get("name") or item.get("title") or "Unknown"
        color = (item.get("color") or "Unknown").strip().title()
        category = (item.get("category") or item.get("cat") or "other").strip().lower()
        wear_count = int(item.get("wear_count") or item.get("wears") or 0)
        price = float(item.get("price") or item.get("price_estimate_usd") or 0)
        last_worn_raw = item.get("last_worn") or item.get("last_worn_at")

        color_counts[color] += 1
        category_counts[category] += 1

        # Was the item worn in the last 30 days?
        if last_worn_raw:
            try:
                last_worn_dt = datetime.datetime.fromisoformat(str(last_worn_raw)[:10])
                if last_worn_dt >= cutoff_30d:
                    worn_30d += 1
                else:
                    days_unworn = (now_ts - last_worn_dt).days
                    if days_unworn >= 30:
                        dead_stock.append({"name": name, "days_unworn": days_unworn})
            except ValueError:
                pass
        elif wear_count == 0:
            dead_stock.append({"name": name, "days_unworn": 999})

        # Cost per wear
        if wear_count > 0 and price > 0:
            cpw = price / wear_count
            total_cpw += cpw
            cpw_count += 1

        # Most worn
        if wear_count > most_worn_count:
            most_worn_count = wear_count
            most_worn_item = {"name": name, "wear_count": wear_count}

    utilization_rate = round((worn_30d / total) * 100) if total > 0 else 0
    avg_cpw = round(total_cpw / cpw_count, 2) if cpw_count > 0 else 0.0

    # Build sorted distributions
    color_total = sum(color_counts.values()) or 1
    color_distribution = sorted(
        [
            {"color": c, "count": n, "pct": round((n / color_total) * 100)}
            for c, n in color_counts.items()
        ],
        key=lambda x: x["count"],
        reverse=True,
    )
    category_distribution = sorted(
        [{"cat": c, "count": n} for c, n in category_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )
    dead_stock.sort(key=lambda x: x["days_unworn"], reverse=True)

    logger.info(
        "analytics_wardrobe: user=%s items=%d utilization=%d%% dead=%d range=%s",
        user_key, total, utilization_rate, len(dead_stock), range or "all",
    )

    return {
        "utilization_rate": utilization_rate,
        "avg_cpw": avg_cpw,
        "color_distribution": color_distribution,
        "category_distribution": category_distribution,
        "most_worn": most_worn_item,
        "dead_stock": dead_stock[:10],  # cap at 10 worst offenders
        "range": range or "all",
    }


# ---------------------------------------------------------------------------
# POST /api/challenge/complete — track challenge completions in SQLite
# ---------------------------------------------------------------------------

class ChallengeCompleteRequest(BaseModel):
    challenge_id: str
    user_key: Optional[str] = None


@app.post("/api/challenge/complete")
async def challenge_complete(request: Request, body: ChallengeCompleteRequest):
    """Record a challenge completion and return points earned + running total.

    Rate limited to 10 completions per hour per user_key to prevent abuse.
    Points per challenge type are defined in CHALLENGE_POINTS above.
    """
    # MG-005: resolve user_key from request IP, allow override from body
    ip_key = (request.client.host if request.client else None) or "anon"
    user_key = body.user_key or ip_key

    # Hourly rate limit — 10 completions per hour per user_key
    if not check_rate_limit_window(user_key, "challenge_complete", 10, window=3600):
        logger.warning("Rate limit exceeded: challenge_complete from %s", user_key)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded — max 10 challenge completions per hour.",
        )

    challenge_id = body.challenge_id.strip().lower()
    if not challenge_id:
        raise HTTPException(status_code=400, detail="challenge_id must not be empty.")

    points_earned = CHALLENGE_POINTS.get(challenge_id, CHALLENGE_POINTS_DEFAULT)
    today = datetime.date.today().isoformat()

    with _get_db() as db:
        db.execute(
            """
            INSERT INTO challenge_completions (user_key, challenge_id, date, points)
            VALUES (?, ?, ?, ?)
            """,
            (user_key, challenge_id, today, points_earned),
        )
        db.commit()

        # Sum all points for this user_key across all time
        row = db.execute(
            "SELECT COALESCE(SUM(points), 0) AS total FROM challenge_completions WHERE user_key = ?",
            (user_key,),
        ).fetchone()
        total_points = int(row["total"])

    logger.info(
        "challenge_complete: user=%s challenge=%s points_earned=%d total=%d",
        user_key, challenge_id, points_earned, total_points,
    )

    return {
        "points_earned": points_earned,
        "total_points": total_points,
    }


# ---------------------------------------------------------------------------
# Stylist Bookings — POST / GET / DELETE /api/bookings
# ---------------------------------------------------------------------------

class BookingCreateRequest(BaseModel):
    stylist_id: str
    stylist_name: str
    session_type: str
    slot_label: str


@app.post("/api/bookings")
async def create_booking(request: Request, body: BookingCreateRequest):
    """Create a new stylist booking and return booking_id + status.

    Rate limited to 30 requests/minute per user_key (MG-005).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "bookings", 30):
        logger.warning("Rate limit exceeded: bookings from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    stylist_id = body.stylist_id.strip()
    stylist_name = body.stylist_name.strip()
    session_type = body.session_type.strip()
    slot_label = body.slot_label.strip()

    if not stylist_id or not stylist_name or not session_type or not slot_label:
        raise HTTPException(status_code=400, detail="All fields are required: stylist_id, stylist_name, session_type, slot_label.")

    with _get_db() as db:
        cursor = db.execute(
            """
            INSERT INTO stylist_bookings (user_key, stylist_id, stylist_name, session_type, slot_label)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_key, stylist_id, stylist_name, session_type, slot_label),
        )
        db.commit()
        booking_id = cursor.lastrowid

    logger.info(
        "bookings_create: user=%s stylist=%s session=%s slot=%s id=%d",
        user_key, stylist_id, session_type, slot_label, booking_id,
    )

    return {"booking_id": booking_id, "status": "confirmed"}


@app.get("/api/bookings")
async def list_bookings(request: Request):
    """Return all bookings for the current user_key ordered by booked_at DESC.

    Rate limited to 30 requests/minute per user_key (MG-005).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "bookings", 30):
        logger.warning("Rate limit exceeded: bookings from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    with _get_db() as db:
        rows = db.execute(
            """
            SELECT id, stylist_id, stylist_name, session_type, slot_label, booked_at, status
            FROM stylist_bookings
            WHERE user_key = ?
            ORDER BY booked_at DESC
            """,
            (user_key,),
        ).fetchall()

    bookings = [dict(row) for row in rows]
    logger.info("bookings_list: user=%s count=%d", user_key, len(bookings))
    return {"bookings": bookings}


@app.delete("/api/bookings/{booking_id}")
async def cancel_booking(booking_id: int, request: Request):
    """Soft-delete a booking by setting status='cancelled'.

    Returns 404 if the booking does not exist or does not belong to the
    current user_key.  Rate limited to 30 requests/minute (MG-005).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "bookings", 30):
        logger.warning("Rate limit exceeded: bookings from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    with _get_db() as db:
        # Verify ownership before mutating
        row = db.execute(
            "SELECT id FROM stylist_bookings WHERE id = ? AND user_key = ?",
            (booking_id, user_key),
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Booking not found.")

        db.execute(
            "UPDATE stylist_bookings SET status = 'cancelled' WHERE id = ? AND user_key = ?",
            (booking_id, user_key),
        )
        db.commit()

    logger.info("bookings_cancel: user=%s booking_id=%d", user_key, booking_id)
    return {"booking_id": booking_id, "status": "cancelled"}


# ---------------------------------------------------------------------------
# Wishlist — POST /api/wishlist/toggle · GET /api/wishlist · GET /api/wishlist/status
# SQLite-backed per BE-004/BE-005. MG-005 user_key. Rate limit 30/min on writes.
# ---------------------------------------------------------------------------

class WishlistToggleRequest(BaseModel):
    item_id: str
    item_type: str = "marketplace"
    item_data: dict = {}


@app.post("/api/wishlist/toggle")
async def wishlist_toggle(request: Request, body: WishlistToggleRequest):
    """Toggle a wishlist item for the current user.

    If the item already exists in the wishlist it is removed and the response
    contains ``saved: false``.  Otherwise it is inserted and the response
    contains ``saved: true``.  Either way ``count`` reflects the new total
    number of saved items for this user.

    Rate limited to 30 requests/minute per user_key (MG-005).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "wishlist_toggle", 30):
        logger.warning("Rate limit exceeded: wishlist_toggle from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    item_id = body.item_id.strip()
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id is required.")

    item_type = body.item_type.strip() or "marketplace"
    item_data_json = json.dumps(body.item_data)

    with _get_db() as db:
        existing = db.execute(
            "SELECT 1 FROM wishlist WHERE user_key = ? AND item_id = ?",
            (user_key, item_id),
        ).fetchone()

        if existing:
            db.execute(
                "DELETE FROM wishlist WHERE user_key = ? AND item_id = ?",
                (user_key, item_id),
            )
            saved = False
        else:
            db.execute(
                """
                INSERT INTO wishlist (user_key, item_id, item_type, item_data)
                VALUES (?, ?, ?, ?)
                """,
                (user_key, item_id, item_type, item_data_json),
            )
            saved = True

        db.commit()

        count = db.execute(
            "SELECT COUNT(*) FROM wishlist WHERE user_key = ?",
            (user_key,),
        ).fetchone()[0]

    logger.info("wishlist_toggle: user=%s item_id=%s saved=%s count=%d", user_key, item_id, saved, count)
    return {"saved": saved, "count": count}


@app.get("/api/wishlist")
async def get_wishlist(request: Request):
    """Return all wishlist items for the current user ordered by saved date DESC.

    Each item includes the stored ``item_data`` JSON snapshot and ``created_at``.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "wishlist_get", 30):
        logger.warning("Rate limit exceeded: wishlist_get from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    with _get_db() as db:
        rows = db.execute(
            """
            SELECT id, item_id, item_type, item_data, created_at
            FROM wishlist
            WHERE user_key = ?
            ORDER BY created_at DESC
            """,
            (user_key,),
        ).fetchall()

    items = []
    for row in rows:
        entry = dict(row)
        raw = entry.get("item_data")
        entry["item_data"] = json.loads(raw) if raw else {}
        items.append(entry)

    logger.info("wishlist_list: user=%s count=%d", user_key, len(items))
    return {"items": items, "total": len(items)}


@app.get("/api/wishlist/status")
async def get_wishlist_status(request: Request, item_ids: str = ""):
    """Return saved status and per-item save count for a comma-separated list of item IDs.

    Query param ``item_ids`` — e.g. ``?item_ids=abc,def,ghi``.

    Response shape::

        {
            "saved": {"abc": true, "def": false},
            "counts": {"abc": 3, "def": 0}
        }

    ``counts`` reflects how many *different* users have saved each item,
    giving a lightweight social-proof signal to the frontend.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "wishlist_status", 30):
        logger.warning("Rate limit exceeded: wishlist_status from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    if not item_ids.strip():
        return {"saved": {}, "counts": {}}

    ids = [i.strip() for i in item_ids.split(",") if i.strip()]
    if not ids:
        return {"saved": {}, "counts": {}}

    placeholders = ",".join("?" * len(ids))

    with _get_db() as db:
        # Which of these items has the current user saved?
        user_rows = db.execute(
            f"SELECT item_id FROM wishlist WHERE user_key = ? AND item_id IN ({placeholders})",
            [user_key] + ids,
        ).fetchall()
        user_saved_ids = {row["item_id"] for row in user_rows}

        # Total save count per item (all users — social proof).
        count_rows = db.execute(
            f"SELECT item_id, COUNT(*) AS cnt FROM wishlist WHERE item_id IN ({placeholders}) GROUP BY item_id",
            ids,
        ).fetchall()
        count_map = {row["item_id"]: row["cnt"] for row in count_rows}

    saved_map = {iid: (iid in user_saved_ids) for iid in ids}
    counts_map = {iid: count_map.get(iid, 0) for iid in ids}

    return {"saved": saved_map, "counts": counts_map}


# ---------------------------------------------------------------------------
# Analytics — wear_log table  (wear events + summary + wrapped)
# POST /api/analytics/wear · GET /api/analytics/summary · GET /api/analytics/wrapped/{year}
# BE-004/BE-005: SQLite from day 1. MG-005: user_key from IP. OW-001: grep 3 layers.
# ---------------------------------------------------------------------------

# Demo seed values used when a user has no real wear_log data yet.
_ANALYTICS_DEMO = {
    "total_items": 24,
    "utilization_rate": 0.34,
    "avg_cost_per_wear": 8.40,
    "dead_zone_count": 3,
    "rewear_score": 71,
    "sustainability": {
        "preloved_items": 5,
        "co2_saved_kg": 12.4,
    },
    "top_style_tags": ["minimal", "vintage", "Y2K"],
    "style_archetype": "The Quiet Minimalist",
    "most_worn": {
        "item_id": "demo_blazer",
        "item_name": "Black Blazer",
        "wear_count": 47,
        "cpw": 2.30,
    },
    "least_efficient": {
        "item_id": "demo_skirt",
        "item_name": "Satin Skirt",
        "price": 180.0,
        "wear_count": 1,
        "cpw": 180.0,
    },
}

_WRAPPED_DEMO = {
    "style_word": "Minimalist",
    "total_outfits": 127,
    "most_worn_item": "Black Blazer",
    "cpw_champion": {"name": "Black Blazer", "cpw": 2.30, "wears": 47},
    "items_never_worn": 23,
    "phantom_value_usd": 1240.0,
    "rewear_rate": 0.71,
    "co2_saved_kg": 12.4,
    "trend_pioneer_score": 87,
    "color_palette": ["#1a1a2e", "#c4855a", "#f0ecf5", "#52c97a", "#8a8498"],
}

# ---------------------------------------------------------------------------
# Season helpers — 2 seasons only: summer (Apr–Sep) and winter (Oct–Mar).
# "Winter year" = the January side (e.g. Winter 2026 = Oct 2025 – Mar 2026).
# ---------------------------------------------------------------------------

def _get_current_season() -> tuple[str, int, "datetime.date", "datetime.date"]:
    """Return (season, year, start_date, end_date) for today's date.

    summer: April 1 – September 30 of the same calendar year.
    winter: October 1 of year Y – March 31 of year Y+1.
            The *year label* is Y+1 (the January side).
    """
    today = datetime.date.today()
    m, y = today.month, today.year
    if 4 <= m <= 9:
        return "summer", y, datetime.date(y, 4, 1), datetime.date(y, 9, 30)
    else:
        winter_year = y if m >= 10 else y - 1
        return "winter", winter_year + 1, datetime.date(winter_year, 10, 1), datetime.date(winter_year + 1, 3, 31)


def _season_date_range(season: str, year: int) -> tuple["datetime.date", "datetime.date"]:
    """Return (start_date, end_date) for a given season+year label.

    summer 2026 → 2026-04-01 .. 2026-09-30
    winter 2026 → 2025-10-01 .. 2026-03-31
    Raises ValueError on invalid input.
    """
    season = season.lower()
    if season == "summer":
        return datetime.date(year, 4, 1), datetime.date(year, 9, 30)
    elif season == "winter":
        return datetime.date(year - 1, 10, 1), datetime.date(year, 3, 31)
    else:
        raise ValueError(f"Unknown season '{season}' — must be 'summer' or 'winter'.")


def _season_display_name(season: str, year: int) -> str:
    return f"{'Summer' if season == 'summer' else 'Winter'} {year}"


_STYLE_ARCHETYPES = [
    "The Quiet Minimalist",
    "The Vintage Soul",
    "The Streetwear Pioneer",
    "The Maximalist Dreamer",
    "The Athleisure Native",
    "The Coastal Wanderer",
    "The Dark Romantic",
    "The Boho Free Spirit",
]

_STYLE_WORDS = ["Minimalist", "Vintage", "Streetwear", "Bold", "Athleisure", "Coastal", "Dark", "Boho"]


class WearLogRequest(BaseModel):
    item_id: str
    item_name: str = ""
    style_tags: list[str] = []


@app.post("/api/analytics/wear")
async def log_wear_event(request: Request, body: WearLogRequest):
    """Log a single wear event for the current user.

    Stores item_id, item_name, style_tags (JSON array) and current timestamp
    in the wear_log SQLite table.  Rate limited to 60 requests/minute.

    Returns::

        { "logged": true, "total_wears": N }
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_wear", 60):
        logger.warning("Rate limit exceeded: analytics_wear from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    item_id = body.item_id.strip()
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id is required.")

    item_name = body.item_name.strip()
    style_tags_json = json.dumps(body.style_tags)

    with _get_db() as db:
        db.execute(
            """
            INSERT INTO wear_log (user_key, item_id, item_name, style_tags)
            VALUES (?, ?, ?, ?)
            """,
            (user_key, item_id, item_name, style_tags_json),
        )
        db.commit()

        total_wears = db.execute(
            "SELECT COUNT(*) FROM wear_log WHERE user_key = ?",
            (user_key,),
        ).fetchone()[0]

    logger.info("wear_log: user=%s item_id=%s total_wears=%d", user_key, item_id, total_wears)
    return {"logged": True, "total_wears": total_wears}


@app.get("/api/analytics/summary")
async def analytics_summary(request: Request):
    """Return wardrobe analytics summary for the current user.

    Computes live stats from the wear_log table when the user has data.
    Falls back to realistic demo seed values for new users with no wear history.

    Stats computed from real data:
    - utilization_rate: fraction of distinct items worn in the last 30 days
    - avg_cost_per_wear: not computed server-side (no price stored) — returns demo value
    - dead_zone_count: distinct items not worn in 60+ days
    - rewear_score: % of distinct items worn at least twice
    - top_style_tags: 3 most-used style tags across all wear events
    - style_archetype: derived from top style tags
    - most_worn: item with most wear events
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_summary", 60):
        logger.warning("Rate limit exceeded: analytics_summary from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    with _get_db() as db:
        total_rows = db.execute(
            "SELECT COUNT(*) FROM wear_log WHERE user_key = ?",
            (user_key,),
        ).fetchone()[0]

        # No real data yet — return demo values so the UI is never empty.
        if total_rows == 0:
            return dict(_ANALYTICS_DEMO)

        # --- Distinct items worn at all ---
        all_items_rows = db.execute(
            "SELECT DISTINCT item_id FROM wear_log WHERE user_key = ?",
            (user_key,),
        ).fetchall()
        all_item_ids = [r[0] for r in all_items_rows]
        total_distinct = len(all_item_ids)

        # --- Items worn in last 30 days ---
        cutoff_30d = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).isoformat()
        worn_30d_rows = db.execute(
            """
            SELECT DISTINCT item_id FROM wear_log
            WHERE user_key = ? AND worn_at >= ?
            """,
            (user_key, cutoff_30d),
        ).fetchall()
        worn_30d_ids = {r[0] for r in worn_30d_rows}
        utilization_rate = round(len(worn_30d_ids) / total_distinct, 2) if total_distinct else 0.0

        # --- Dead zone: items not worn in 60+ days (or never worn in 60+ days window) ---
        cutoff_60d = (datetime.datetime.utcnow() - datetime.timedelta(days=60)).isoformat()
        dead_rows = db.execute(
            """
            SELECT item_id FROM wear_log
            WHERE user_key = ?
            GROUP BY item_id
            HAVING MAX(worn_at) < ?
            """,
            (user_key, cutoff_60d),
        ).fetchall()
        dead_zone_count = len(dead_rows)

        # --- Rewear score: % of distinct items worn >= 2 times ---
        reworn_rows = db.execute(
            """
            SELECT COUNT(*) FROM (
                SELECT item_id FROM wear_log
                WHERE user_key = ?
                GROUP BY item_id
                HAVING COUNT(*) >= 2
            )
            """,
            (user_key,),
        ).fetchone()[0]
        rewear_score = round((reworn_rows / total_distinct) * 100) if total_distinct else 0

        # --- Most worn item ---
        most_worn_row = db.execute(
            """
            SELECT item_id, item_name, COUNT(*) AS wear_count
            FROM wear_log
            WHERE user_key = ?
            GROUP BY item_id
            ORDER BY wear_count DESC
            LIMIT 1
            """,
            (user_key,),
        ).fetchone()
        most_worn = None
        if most_worn_row:
            most_worn = {
                "item_id": most_worn_row["item_id"],
                "item_name": most_worn_row["item_name"] or most_worn_row["item_id"],
                "wear_count": most_worn_row["wear_count"],
                "cpw": None,  # price not stored server-side
            }

        # --- Top style tags (across all wear events) ---
        tag_rows = db.execute(
            "SELECT style_tags FROM wear_log WHERE user_key = ? AND style_tags IS NOT NULL",
            (user_key,),
        ).fetchall()
        tag_counts: dict[str, int] = defaultdict(int)
        for row in tag_rows:
            try:
                tags = json.loads(row[0] or "[]")
                for tag in tags:
                    if isinstance(tag, str) and tag.strip():
                        tag_counts[tag.strip().lower()] += 1
            except (json.JSONDecodeError, TypeError):
                pass
        top_style_tags = [t for t, _ in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:3]]

        # --- Style archetype: map top tag to archetype ---
        _tag_archetype_map = {
            "minimal": "The Quiet Minimalist",
            "vintage": "The Vintage Soul",
            "streetwear": "The Streetwear Pioneer",
            "maximalist": "The Maximalist Dreamer",
            "athleisure": "The Athleisure Native",
            "coastal": "The Coastal Wanderer",
            "dark": "The Dark Romantic",
            "boho": "The Boho Free Spirit",
            "y2k": "The Streetwear Pioneer",
            "office": "The Quiet Minimalist",
        }
        style_archetype = "The Quiet Minimalist"
        if top_style_tags:
            style_archetype = _tag_archetype_map.get(top_style_tags[0], "The Quiet Minimalist")

    logger.info(
        "analytics_summary: user=%s total_rows=%d distinct=%d utilization=%.2f rewear=%d%%",
        user_key, total_rows, total_distinct, utilization_rate, rewear_score,
    )

    return {
        "total_items": total_distinct,
        "utilization_rate": utilization_rate,
        "avg_cost_per_wear": _ANALYTICS_DEMO["avg_cost_per_wear"],  # needs price data
        "dead_zone_count": dead_zone_count,
        "rewear_score": rewear_score,
        "sustainability": _ANALYTICS_DEMO["sustainability"],
        "top_style_tags": top_style_tags or _ANALYTICS_DEMO["top_style_tags"],
        "style_archetype": style_archetype,
        "most_worn": most_worn or _ANALYTICS_DEMO["most_worn"],
        "least_efficient": _ANALYTICS_DEMO["least_efficient"],  # needs price data
    }


def _compute_wrapped_summary(
    db: "sqlite3.Connection",
    user_key: str,
    start_iso: str,
    end_iso: str,
) -> dict:
    """Compute Wrapped-style summary for a date window.

    Returns the summary dict (real data) or None if no wear events exist.
    Internal helper — no rate-limit, no request context.
    """
    rows = db.execute(
        """
        SELECT item_id, item_name, style_tags
        FROM wear_log
        WHERE user_key = ?
          AND worn_at >= ?
          AND worn_at <= ?
        """,
        (user_key, start_iso, end_iso),
    ).fetchall()

    if not rows:
        return None  # caller decides fallback

    total_outfits = len(rows)

    item_counts: dict[str, dict] = {}
    for row in rows:
        iid = row["item_id"]
        if iid not in item_counts:
            item_counts[iid] = {
                "item_id": iid,
                "item_name": row["item_name"] or iid,
                "wears": 0,
            }
        item_counts[iid]["wears"] += 1

    sorted_items = sorted(item_counts.values(), key=lambda x: x["wears"], reverse=True)
    top_item = sorted_items[0]

    cpw_champion = {
        "name": top_item["item_name"],
        "cpw": None,
        "wears": top_item["wears"],
    }

    all_item_ids_rows = db.execute(
        "SELECT DISTINCT item_id FROM wear_log WHERE user_key = ?",
        (user_key,),
    ).fetchall()
    all_item_ids = {r[0] for r in all_item_ids_rows}
    window_item_ids = {r["item_id"] for r in rows}
    items_never_worn_window = len(all_item_ids - window_item_ids)

    reworn = sum(1 for v in item_counts.values() if v["wears"] >= 2)
    rewear_rate = round(reworn / len(item_counts), 2) if item_counts else 0.0

    tag_counts: dict[str, int] = defaultdict(int)
    for row in rows:
        try:
            tags = json.loads(row["style_tags"] or "[]")
            for tag in tags:
                if isinstance(tag, str) and tag.strip():
                    tag_counts[tag.strip().lower()] += 1
        except (json.JSONDecodeError, TypeError):
            pass
    top_tags = [t for t, _ in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:3]]

    _tag_style_word_map = {
        "minimal": "Minimalist",
        "vintage": "Vintage",
        "streetwear": "Streetwear",
        "maximalist": "Bold",
        "athleisure": "Athleisure",
        "coastal": "Coastal",
        "dark": "Dark",
        "boho": "Boho",
        "y2k": "Y2K",
        "office": "Classic",
    }
    style_word = _tag_style_word_map.get(top_tags[0] if top_tags else "", "Minimalist")
    trend_pioneer_score = min(100, len(tag_counts) * 12)

    return {
        "style_word": style_word,
        "total_outfits": total_outfits,
        "most_worn_item": top_item["item_name"],
        "cpw_champion": cpw_champion,
        "items_never_worn": items_never_worn_window,
        "phantom_value_usd": _WRAPPED_DEMO["phantom_value_usd"],
        "rewear_rate": rewear_rate,
        "co2_saved_kg": round(total_outfits * 0.0977, 1),
        "trend_pioneer_score": trend_pioneer_score,
        "color_palette": _WRAPPED_DEMO["color_palette"],
    }


@app.get("/api/analytics/wrapped/{year}")
async def analytics_wrapped(year: int, request: Request, season: Optional[str] = None):
    """Return a Spotify Wrapped-style summary for the given year.

    Optional query param ``season``:
    - ``summer`` — April 1 – September 30 of ``year``
    - ``winter`` — October 1 of ``year-1`` – March 31 of ``year``
    - omitted — combined Summer+Winter for the full calendar year (backward compat)

    Uses real wear_log data when available; falls back to demo seed values.
    Year must be between 2020 and 2100.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_wrapped", 60):
        logger.warning("Rate limit exceeded: analytics_wrapped from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    if not (2020 <= year <= 2100):
        raise HTTPException(status_code=400, detail="year must be between 2020 and 2100.")

    if season is not None:
        season = season.lower()
        if season not in ("summer", "winter"):
            raise HTTPException(status_code=400, detail="season must be 'summer' or 'winter'.")

    with _get_db() as db:
        if season is not None:
            start_date, end_date = _season_date_range(season, year)
            start_iso = start_date.isoformat()
            end_iso = end_date.isoformat() + "T23:59:59"
            summary = _compute_wrapped_summary(db, user_key, start_iso, end_iso)
            if summary is None:
                summary = dict(_WRAPPED_DEMO)
            logger.info(
                "analytics_wrapped: user=%s year=%d season=%s total_outfits=%d",
                user_key, year, season, summary.get("total_outfits", 0),
            )
            return {"year": year, "season": season,
                    "display_name": _season_display_name(season, year), **summary}
        else:
            # Backward-compat: full calendar year (Jan 1 – Dec 31)
            start_iso = f"{year}-01-01"
            end_iso = f"{year}-12-31T23:59:59"
            summer_s, summer_e = _season_date_range("summer", year)
            winter_s, winter_e = _season_date_range("winter", year)
            summer_sum = _compute_wrapped_summary(
                db, user_key, summer_s.isoformat(), summer_e.isoformat() + "T23:59:59"
            )
            winter_sum = _compute_wrapped_summary(
                db, user_key, winter_s.isoformat(), winter_e.isoformat() + "T23:59:59"
            )
            combined = _compute_wrapped_summary(db, user_key, start_iso, end_iso)
            if combined is None:
                combined = dict(_WRAPPED_DEMO)
            logger.info(
                "analytics_wrapped: user=%s year=%d (combined) total_outfits=%d",
                user_key, year, combined.get("total_outfits", 0),
            )
            return {
                "year": year,
                **combined,
                "seasons": {
                    "summer": summer_sum or dict(_WRAPPED_DEMO),
                    "winter": winter_sum or dict(_WRAPPED_DEMO),
                },
            }


@app.get("/api/analytics/season/current")
async def analytics_season_current(request: Request):
    """Return the current season with live progress and wear summary.

    Response::

        {
          "season": "summer",
          "year": 2026,
          "display_name": "Summer 2026",
          "start_date": "2026-04-01",
          "end_date": "2026-09-30",
          "days_elapsed": 82,
          "days_remaining": 98,
          "summary": { ...same shape as wrapped endpoint... }
        }

    Falls back to demo data when the user has no wear events this season.
    Rate limited to 60 requests/minute.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_season_current", 60):
        logger.warning("Rate limit exceeded: analytics_season_current from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    season, year, start_date, end_date = _get_current_season()
    today = datetime.date.today()
    days_elapsed = (today - start_date).days
    days_remaining = (end_date - today).days

    start_iso = start_date.isoformat()
    end_iso = end_date.isoformat() + "T23:59:59"

    with _get_db() as db:
        summary = _compute_wrapped_summary(db, user_key, start_iso, end_iso)
        if summary is None:
            summary = dict(_WRAPPED_DEMO)

    logger.info(
        "analytics_season_current: user=%s season=%s/%d elapsed=%d remaining=%d",
        user_key, season, year, days_elapsed, days_remaining,
    )

    return {
        "season": season,
        "year": year,
        "display_name": _season_display_name(season, year),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "summary": summary,
    }


@app.get("/api/analytics/seasons/archive")
async def analytics_seasons_archive(request: Request):
    """Return list of seasons for which the user has wear data.

    Covers the last 4 seasons (2 years back) plus the current season.
    Seasons with no data are included with outfit_count=0 and score=null.

    Response::

        {
          "seasons": [
            {"season": "summer", "year": 2026, "display_name": "Summer 2026",
             "outfit_count": 42, "score": 71},
            ...
          ]
        }

    Rate limited to 30 requests/minute.
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "analytics_seasons_archive", 30):
        logger.warning("Rate limit exceeded: analytics_seasons_archive from %s", user_key)
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    current_season, current_year, _, _ = _get_current_season()

    # Build list of last 5 season slots (current + 4 prior), most-recent first.
    slots: list[tuple[str, int]] = []
    s, y = current_season, current_year
    for _ in range(5):
        slots.append((s, y))
        # Step back one season
        if s == "summer":
            s, y = "winter", y  # Winter of the same label-year comes before Summer
        else:
            s, y = "summer", y - 1

    result_seasons = []
    with _get_db() as db:
        for season, year in slots:
            start_date, end_date = _season_date_range(season, year)
            start_iso = start_date.isoformat()
            end_iso = end_date.isoformat() + "T23:59:59"

            count_row = db.execute(
                """
                SELECT COUNT(*) FROM wear_log
                WHERE user_key = ? AND worn_at >= ? AND worn_at <= ?
                """,
                (user_key, start_iso, end_iso),
            ).fetchone()
            outfit_count = count_row[0] if count_row else 0

            score: Optional[int] = None
            if outfit_count > 0:
                # Rewear score for the season (% of items worn >= 2 times)
                item_rows = db.execute(
                    """
                    SELECT item_id, COUNT(*) AS c FROM wear_log
                    WHERE user_key = ? AND worn_at >= ? AND worn_at <= ?
                    GROUP BY item_id
                    """,
                    (user_key, start_iso, end_iso),
                ).fetchall()
                total_items = len(item_rows)
                reworn = sum(1 for r in item_rows if r["c"] >= 2)
                score = round((reworn / total_items) * 100) if total_items else 0

            result_seasons.append({
                "season": season,
                "year": year,
                "display_name": _season_display_name(season, year),
                "outfit_count": outfit_count,
                "score": score,
            })

    logger.info(
        "analytics_seasons_archive: user=%s seasons_returned=%d",
        user_key, len(result_seasons),
    )
    return {"seasons": result_seasons}


# ---------------------------------------------------------------------------
# Orders + Creator Credits — POST /api/orders · GET /api/wallet
# SQLite-backed per MASTER_PLAN A7. MG-005 user_key. BE-004/BE-005.
# ---------------------------------------------------------------------------

class OrderCreate(BaseModel):
    product_name: str = ""
    product_id: str = ""
    amount_usd: float = 0.0
    influencer_id: str = ""
    post_id: str = ""
    client_ref: str = ""
    # In-app order facade (preloved / retail). All optional & backward-compatible:
    # the live web checkout sends only amount_usd/influencer_id and gets kind='retail',
    # commission 0 — unchanged. ``price`` is an alias for amount_usd (spec body); when
    # supplied it takes precedence. ``kind``: 'preloved' (P2P, 8% commission) | 'retail'.
    price: Optional[float] = None
    kind: str = "retail"
    seller_key: str = ""


@app.post("/api/orders")
async def create_order(order: OrderCreate, request: Request):
    """Record an in-app purchase and optionally credit the influencer.

    Writes one row to ``orders`` and, when ``influencer_id`` is provided,
    one row to ``credits`` (5% of ``amount_usd``).

    Rate limited to 20 requests/minute (MG-005).
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "orders", 20):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 20 requests/minute.")

    product_name = (order.product_name or "").strip()
    if not product_name:
        raise HTTPException(status_code=400, detail="product_name is required.")

    # ``price`` (spec) aliases amount_usd (live web checkout). price wins when provided.
    raw_price = order.price if order.price is not None else order.amount_usd
    if raw_price < 0:
        raise HTTPException(status_code=400, detail="price/amount_usd must be >= 0.")
    amount_usd = round(raw_price, 2)

    kind = (order.kind or "retail").strip().lower()
    if kind not in ("preloved", "retail"):
        raise HTTPException(status_code=400, detail="kind must be 'preloved' or 'retail'.")
    seller_key = (order.seller_key or "").strip()
    # AWEAR commission: 8% on preloved (P2P), 0 on retail (dropshipping/affiliate).
    commission_usd = round(amount_usd * PRELOVED_COMMISSION_PCT, 2) if kind == "preloved" else 0.0

    client_ref = (order.client_ref or "").strip()
    if client_ref:
        with _get_db() as db:
            existing = db.execute(
                "SELECT id FROM orders WHERE user_key = ? AND client_ref = ?",
                (user_key, client_ref),
            ).fetchone()
        if existing:
            logger.info("order dedup hit: user=%s client_ref=%s -> %s",
                        user_key, client_ref, existing["id"])
            return {"order_id": existing["id"], "id": existing["id"],
                    "status": "placed", "credit_amount": 0.0, "deduped": True}
    else:
        # Legacy path: the client sent NO client_ref (IDEA #22 — web client does not
        # yet supply an idempotency key). A demo double-tap / fire-and-forget retry of
        # "Buy" would otherwise create a DUPLICATE order AND a duplicate creator credit,
        # doubling the Creator Wallet live in front of investors. Defensive, narrow,
        # time-windowed natural-key dedup: same (user_key, product_id, product_name,
        # amount_usd, influencer_id) seen within ORDER_DEDUP_WINDOW_SEC collapses to the
        # first order. created_at is stored as datetime.utcnow().isoformat(); comparing
        # the same fixed-width ISO format lexicographically is equivalent to time order.
        cutoff = (datetime.datetime.utcnow()
                  - datetime.timedelta(seconds=ORDER_DEDUP_WINDOW_SEC)).isoformat()
        with _get_db() as db:
            existing = db.execute(
                """SELECT id FROM orders
                   WHERE user_key = ?
                     AND product_id = ?
                     AND product_name = ?
                     AND amount_usd = ?
                     AND COALESCE(influencer_id, '') = ?
                     AND created_at >= ?
                   ORDER BY created_at DESC
                   LIMIT 1""",
                (user_key, order.product_id, product_name, amount_usd,
                 order.influencer_id or "", cutoff),
            ).fetchone()
        if existing:
            logger.info("order natural-dedup hit: user=%s product=%s amount=%.2f -> %s",
                        user_key, product_name, amount_usd, existing["id"])
            return {"order_id": existing["id"], "id": existing["id"],
                    "status": "placed", "credit_amount": 0.0, "deduped": True}

    now = datetime.datetime.utcnow().isoformat()
    order_id = "ord_" + uuid.uuid4().hex[:12]

    with _get_db() as db:
        db.execute(
            """INSERT INTO orders (id, user_key, post_id, product_id, product_name,
                                   amount_usd, status, influencer_id, client_ref, created_at,
                                   kind, seller_key, commission_usd)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (order_id, user_key, order.post_id, order.product_id, product_name,
             amount_usd, "placed", order.influencer_id, client_ref, now,
             kind, seller_key, commission_usd),
        )
        credit_amount = 0.0
        if order.influencer_id:
            credit_amount = round(amount_usd * CREATOR_CREDIT_PCT, 2)
            credit_id = "crd_" + uuid.uuid4().hex[:12]
            db.execute(
                """INSERT INTO credits (id, user_key, order_id, item_name, amount_usd, type, created_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (credit_id, order.influencer_id, order_id, product_name,
                 credit_amount, "creator", now),
            )
        db.commit()

    logger.info("order created: id=%s user=%s kind=%s price=%.2f commission=%.2f influencer=%s credit=%.2f",
                order_id, user_key, kind, amount_usd, commission_usd,
                order.influencer_id or "none", credit_amount)
    # Return the full order row (spec) while keeping the legacy keys the live web
    # checkout already ignores-safely (order_id, status, credit_amount).
    return {
        "order_id": order_id,
        "id": order_id,
        "buyer_key": user_key,
        "seller_key": seller_key or None,
        "product_id": order.product_id,
        "product_name": product_name,
        "kind": kind,
        "price_usd": amount_usd,
        "amount_usd": amount_usd,
        "commission_usd": commission_usd,
        "status": "placed",
        "created_at": now,
        "credit_amount": credit_amount,
        "deduped": False,
    }


@app.get("/api/orders")
async def list_orders(request: Request):
    """Return the caller's in-app orders, newest first.

    MG-005 ``user_key`` = ``buyer_key``. Rate limited to 30 requests/minute.

    Response::

        {
          "items": [
            {"id": "ord_abc", "buyer_key": "127.0.0.1", "seller_key": null,
             "product_id": "p1", "product_name": "Linen blazer",
             "kind": "preloved", "price_usd": 50.0, "commission_usd": 4.0,
             "status": "placed", "created_at": "2026-06-30T10:00:00"}
          ],
          "total": 1
        }
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "orders_list", 30):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    with _get_db() as db:
        rows = db.execute(
            """SELECT id, user_key, seller_key, product_id, product_name, kind,
                      amount_usd, commission_usd, status, created_at
               FROM orders WHERE user_key = ?
               ORDER BY created_at DESC, id DESC LIMIT 200""",
            (user_key,),
        ).fetchall()

    items = [
        {
            "id": r["id"],
            "buyer_key": r["user_key"],
            "seller_key": r["seller_key"] or None,
            "product_id": r["product_id"],
            "product_name": r["product_name"],
            "kind": r["kind"] or "retail",
            "price_usd": r["amount_usd"],
            "commission_usd": r["commission_usd"] if r["commission_usd"] is not None else 0.0,
            "status": r["status"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    logger.info("orders list: user=%s count=%d", user_key, len(items))
    return {"items": items, "total": len(items)}


@app.get("/api/wallet")
async def get_wallet(request: Request, user_id: str = ""):
    """Return a creator's credit balance and history.

    ``credits`` rows are written with ``user_key = influencer_id`` (a profile id,
    e.g. "user_carmel") by ``POST /api/orders`` — NOT the caller's IP. So the
    caller-IP-based BE-006 ``user_key`` is only a fallback: pass the creator's
    profile id as ``?user_id=`` to look up their actual wallet. When ``user_id``
    is omitted, we fall back to the legacy (pre-fix) BE-006 IP-keyed lookup for
    backward compatibility — no current frontend caller relies on it, but the
    contract is kept.

    ``balance`` is summed over the creator's FULL credits ledger (a separate
    SELECT, no LIMIT) so it can't undercount past the history page size.
    ``credits`` (the displayed history) stays capped at the most recent 50 rows.

    Rate limited to 30 requests/minute, keyed on the caller's IP (BE-006) —
    NOT on ``user_id`` — so one caller can't burn another creator's rate-limit
    bucket by querying their wallet repeatedly.

    Response::

        {
          "balance": 14.75,
          "credits": [
            {"id": "crd_abc", "item": "Linen blazer", "amount": 4.50,
             "order_id": "ord_xyz", "created_at": "2026-06-24T10:00:00"}
          ]
        }
    """
    caller_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(caller_key, "wallet", 30):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    wallet_user_id = (user_id or "").strip()
    if len(wallet_user_id) > 64:
        raise HTTPException(status_code=400, detail="user_id must be at most 64 characters.")
    lookup_key = wallet_user_id or caller_key

    with _get_db() as db:
        total_row = db.execute(
            "SELECT COALESCE(SUM(amount_usd), 0) AS total FROM credits WHERE user_key = ?",
            (lookup_key,),
        ).fetchone()
        rows = db.execute(
            """SELECT id, order_id, item_name, amount_usd, created_at
               FROM credits WHERE user_key = ?
               ORDER BY created_at DESC LIMIT 50""",
            (lookup_key,),
        ).fetchall()

    credits = [
        {"id": r["id"], "item": r["item_name"], "amount": r["amount_usd"],
         "order_id": r["order_id"], "created_at": r["created_at"]}
        for r in rows
    ]
    balance = round(total_row["total"], 2)
    logger.info("wallet: user=%s balance=%.2f credits=%d", lookup_key, balance, len(credits))
    return {"balance": balance, "credits": credits}


# ---------------------------------------------------------------------------
# Ephemeral 24h Stories (outfit-of-the-day) — POST/GET/DELETE /api/stories
# SQLite-backed (stories). MG-005 user_key. A story is visible for 24h from
# created_at; GET filters expired ones in SQL. Only the owner can delete.
# ---------------------------------------------------------------------------

STORY_TTL_HOURS = 24  # a story is active for 24h from created_at


class StoryCreate(BaseModel):
    image_url: str
    caption: str = ""


@app.post("/api/stories")
async def create_story(story: StoryCreate, request: Request):
    """Post an ephemeral 24h story. Rate limited to 20 requests/minute (MG-005)."""
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "stories_post", 20):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 20 requests/minute.")

    image_url = (story.image_url or "").strip()
    if not image_url:
        raise HTTPException(status_code=400, detail="image_url is required.")
    caption = (story.caption or "").strip()
    now = datetime.datetime.utcnow().isoformat()

    with _get_db() as db:
        cur = db.execute(
            "INSERT INTO stories (user_key, image_url, caption, created_at) VALUES (?,?,?,?)",
            (user_key, image_url, caption, now),
        )
        db.commit()
        story_id = cur.lastrowid

    logger.info("story created: id=%s user=%s", story_id, user_key)
    return {
        "id": story_id,
        "user_key": user_key,
        "image_url": image_url,
        "caption": caption,
        "created_at": now,
    }


@app.get("/api/stories")
async def list_stories(request: Request):
    """Return only ACTIVE stories (created_at within the last 24h), newest first.

    Expired stories (>24h) are filtered out in the SQL query. Rate limited to
    60 requests/minute.

    Response: {"items": [{id,user_key,image_url,caption,created_at}], "total": N}
    """
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "stories_list", 60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")

    # created_at is a UTC ISO string of fixed format, so lexicographic >= is
    # equivalent to chronological >= against the same-format cutoff.
    cutoff = (datetime.datetime.utcnow()
              - datetime.timedelta(hours=STORY_TTL_HOURS)).isoformat()
    with _get_db() as db:
        rows = db.execute(
            """SELECT id, user_key, image_url, caption, created_at
               FROM stories
               WHERE created_at >= ?
               ORDER BY created_at DESC, id DESC
               LIMIT 200""",
            (cutoff,),
        ).fetchall()

    items = [
        {
            "id": r["id"],
            "user_key": r["user_key"],
            "image_url": r["image_url"],
            "caption": r["caption"] or "",
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    logger.info("stories list: user=%s active=%d", user_key, len(items))
    return {"items": items, "total": len(items)}


@app.delete("/api/stories/{story_id}")
async def delete_story(story_id: int, request: Request):
    """Delete a story. Only the owner (matching user_key) may delete; else 403."""
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "stories_delete", 30):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    with _get_db() as db:
        row = db.execute(
            "SELECT user_key FROM stories WHERE id = ?", (story_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Story not found.")
        if row["user_key"] != user_key:
            raise HTTPException(status_code=403, detail="Only the owner can delete this story.")
        db.execute("DELETE FROM stories WHERE id = ?", (story_id,))
        db.commit()

    logger.info("story deleted: id=%s user=%s", story_id, user_key)
    return {"deleted": True, "id": story_id}


# ---------------------------------------------------------------------------
# Direct Messages (DM) between users — real user-to-user messaging.
# "me" = MG-005 user_key. "them" = a seed user id (peer_id). Stored in SQLite
# (dm_messages). NOTE: this is NOT the AI Stylist chat (/api/stylist/chat) — that
# endpoint stays untouched.
# ---------------------------------------------------------------------------

class DMSendRequest(BaseModel):
    to_user_id: str
    text: str


def _dm_peer_profile(peer_id: str) -> dict:
    """Resolve peer display metadata from _profiles_cache, with a safe fallback."""
    prof = next((p for p in _profiles_cache if p.get("id") == peer_id), None)
    if prof:
        return {
            "user_id": peer_id,
            "name": prof.get("display_name") or prof.get("username") or peer_id,
            "handle": "@" + (prof.get("username") or peer_id),
            "avatar": prof.get("avatar_url", ""),
        }
    # Fallback for any peer not in the profiles fixture.
    return {
        "user_id": peer_id,
        "name": peer_id,
        "handle": "@" + peer_id,
        "avatar": "",
    }


# Seed conversations: (peer_id, [ (direction, text, minutes_ago), ... ]).
# Newest message in each thread is listed last (largest -> smallest minutes_ago).
_DM_SEED = [
    ("user_011", [
        ("in",  "hey! would you be up for a little styling collab?", 60),
        ("out", "ooh yes — what did you have in mind?", 52),
        ("in",  "thinking a shared autumn capsule, 10 pieces each", 48),
        ("in",  "i can send a moodboard tonight if you're in 🤍", 12),
    ]),
    ("user_004", [
        ("in",  "obsessed with the monochrome look you posted yesterday", 2880),
        ("out", "thank you!! took me three tries to get the proportions right", 2875),
        ("in",  "where's the oversized blazer from? need it", 2870),
        ("out", "thrifted it in florentin, no label sadly", 2860),
        ("in",  "still thinking about it btw 😅", 35),
    ]),
    ("user_009", [
        ("in",  "your boho layering in the last reel was unreal", 240),
        ("out", "you're so sweet 🥹 it's all about the textures honestly", 180),
        ("in",  "drop the crochet vest source pls i'm begging", 150),
    ]),
    ("user_005", [
        ("out", "hey! is the beige trench still up for sale?", 1500),
        ("in",  "it is! size M, barely worn. want more pics?", 1440),
        ("out", "yes please, and would you do 220?", 1435),
        ("in",  "let's do 240 and i'll throw in the belt", 1420),
    ]),
    ("user_002", [
        ("out", "is the vintage market in jaffa open on fridays?", 1440),
        ("in",  "yes til 2pm! go early, the good stuff goes fast", 1420),
        ("out", "amazing, thank you 🙏", 1415),
    ]),
    ("user_001", [
        ("in",  "are you going to the thrift swap this weekend?", 600),
        ("out", "planning to! bringing two bags to trade", 560),
        ("in",  "perfect, let's meet at the entrance at 11", 540),
    ]),
    ("user_006", [
        ("in",  "what sneakers are those in your gym fit?", 720),
        ("out", "the low-top sambas! comfiest thing i own", 700),
    ]),
    ("user_003", [
        ("in",  "your capsule breakdown saved me so much closet space", 4320),
        ("out", "that's the dream! what did you end up cutting?", 4200),
        ("in",  "like 30 pieces 😭 felt amazing tbh", 4100),
    ]),
]


def _seed_dm_for_owner(owner_key: str) -> None:
    """Idempotently seed demo conversations for an owner_key with no DM history."""
    now = datetime.datetime.utcnow()
    with _get_db() as db:
        existing = db.execute(
            "SELECT 1 FROM dm_messages WHERE owner_key = ? LIMIT 1", (owner_key,)
        ).fetchone()
        if existing:
            return
        for peer_id, msgs in _DM_SEED:
            # An inbound message is "read" if I replied after it (any later outbound in
            # the thread); only inbound messages after my last reply stay unread — so a
            # conversation where I sent the last message shows no false unread badge.
            last_out_idx = max((i for i, m in enumerate(msgs) if m[0] == "out"), default=-1)
            for idx, (direction, text, minutes_ago) in enumerate(msgs):
                created_at = (now - datetime.timedelta(minutes=minutes_ago)).isoformat()
                read = 0 if (direction == "in" and idx > last_out_idx) else 1
                db.execute(
                    """INSERT INTO dm_messages
                       (owner_key, peer_id, direction, text, created_at, read)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (owner_key, peer_id, direction, text, created_at, read),
                )
        db.commit()
    logger.info("dm_seed: seeded %d conversations for owner=%s", len(_DM_SEED), owner_key)


def _dm_demo_conversations() -> dict:
    """In-memory demo payload used only if the DB layer fails (never returns 500)."""
    now = datetime.datetime.utcnow()
    convos = []
    for peer_id, msgs in _DM_SEED:
        last_dir, last_text, last_min = msgs[-1]
        peer = _dm_peer_profile(peer_id)
        convos.append({
            "user_id": peer["user_id"],
            "name": peer["name"],
            "handle": peer["handle"],
            "avatar": peer["avatar"],
            "last_message": last_text,
            "last_at": (now - datetime.timedelta(minutes=last_min)).isoformat(),
            "unread": sum(1 for d, _, _ in msgs if d == "in"),
        })
    convos.sort(key=lambda c: c["last_at"], reverse=True)
    return {"conversations": convos}


@app.get("/api/dm/conversations")
async def dm_conversations(request: Request):
    """List the current user's DM threads, newest activity first."""
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "dm_conversations", 60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 60 requests/minute.")
    try:
        _seed_dm_for_owner(user_key)
        with _get_db() as db:
            rows = db.execute(
                """SELECT peer_id,
                          COUNT(*)                                          AS total,
                          SUM(CASE WHEN direction='in' AND read=0 THEN 1 ELSE 0 END) AS unread
                   FROM dm_messages
                   WHERE owner_key = ?
                   GROUP BY peer_id""",
                (user_key,),
            ).fetchall()
            convos = []
            for r in rows:
                last = db.execute(
                    """SELECT text, created_at FROM dm_messages
                       WHERE owner_key = ? AND peer_id = ?
                       ORDER BY created_at DESC LIMIT 1""",
                    (user_key, r["peer_id"]),
                ).fetchone()
                peer = _dm_peer_profile(r["peer_id"])
                convos.append({
                    "user_id": peer["user_id"],
                    "name": peer["name"],
                    "handle": peer["handle"],
                    "avatar": peer["avatar"],
                    "last_message": last["text"] if last else "",
                    "last_at": last["created_at"] if last else "",
                    "unread": int(r["unread"] or 0),
                })
        convos.sort(key=lambda c: c["last_at"], reverse=True)
        return {"conversations": convos}
    except Exception as e:
        logger.error("dm_conversations DB error, serving demo fallback: %s", e)
        return _dm_demo_conversations()


@app.get("/api/dm/thread/{user_id}")
async def dm_thread(user_id: str, request: Request):
    """Return one conversation's messages (oldest first) and mark inbound as read."""
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "dm_thread", 120):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 120 requests/minute.")
    peer = _dm_peer_profile(user_id)
    try:
        _seed_dm_for_owner(user_key)
        with _get_db() as db:
            rows = db.execute(
                """SELECT id, direction, text, created_at FROM dm_messages
                   WHERE owner_key = ? AND peer_id = ?
                   ORDER BY created_at ASC, id ASC""",
                (user_key, user_id),
            ).fetchall()
            # Mark this peer's inbound messages as read now that the thread is open.
            db.execute(
                "UPDATE dm_messages SET read = 1 WHERE owner_key = ? AND peer_id = ? AND direction = 'in'",
                (user_key, user_id),
            )
            db.commit()
        messages = [
            {
                "id": r["id"],
                "from": "me" if r["direction"] == "out" else "them",
                "text": r["text"],
                "created_at": r["created_at"],
            }
            for r in rows
        ]
        return {"peer": peer, "messages": messages}
    except Exception as e:
        logger.error("dm_thread DB error, serving demo fallback: %s", e)
        now = datetime.datetime.utcnow()
        seed = next((m for pid, m in _DM_SEED if pid == user_id), [])
        messages = [
            {
                "id": idx + 1,
                "from": "me" if direction == "out" else "them",
                "text": text,
                "created_at": (now - datetime.timedelta(minutes=minutes_ago)).isoformat(),
            }
            for idx, (direction, text, minutes_ago) in enumerate(seed)
        ]
        return {"peer": peer, "messages": messages}


@app.post("/api/dm/send")
async def dm_send(payload: DMSendRequest, request: Request):
    """Send a message from the current user to a peer. Persists to SQLite."""
    user_key = (request.client.host if request.client else None) or "anon"
    if not check_rate_limit(user_key, "dm_send", 30):
        raise HTTPException(status_code=429, detail="Rate limit exceeded — max 30 requests/minute.")

    to_user_id = (payload.to_user_id or "").strip()
    text = (payload.text or "").strip()
    if not to_user_id:
        raise HTTPException(status_code=400, detail="to_user_id required")
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="text too long — max 2000 chars")
    # Reject ghost recipients (e.g. a Community u1-style id) so the DM store never
    # accrues orphaned threads. Fail-open if the profiles cache is empty (startup
    # race / load failure) — mirrors the follows-toggle guard — so a transient cache
    # miss never blocks every legitimate send.
    if _profiles_cache and not any(p.get("id") == to_user_id for p in _profiles_cache):
        raise HTTPException(status_code=404, detail="unknown recipient")

    created_at = datetime.datetime.utcnow().isoformat()
    with _get_db() as db:
        cur = db.execute(
            """INSERT INTO dm_messages
               (owner_key, peer_id, direction, text, created_at, read)
               VALUES (?, ?, 'out', ?, ?, 1)""",
            (user_key, to_user_id, text, created_at),
        )
        db.commit()
        new_id = cur.lastrowid
    logger.info("dm_send: owner=%s peer=%s id=%s", user_key, to_user_id, new_id)
    return {"id": new_id, "created_at": created_at}


app.mount("/static", StaticFiles(directory="static"), name="static")
