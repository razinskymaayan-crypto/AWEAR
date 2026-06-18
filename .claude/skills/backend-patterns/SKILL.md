---
name: backend-patterns
description: Orientation and patterns for AWEAR's app.py FastAPI backend. Use before adding a new endpoint, Pydantic model, Claude API call, or database query. Covers the standard endpoint template, demo fallback pattern, constants location, SQLite access, and how the commerce/currency layers work.
---

# Backend Patterns — app.py

FastAPI + Pydantic + Anthropic SDK + SQLite. Served via uvicorn on port 8000.

## File Structure

```
app.py
├── Imports + optional Google services (lines 1–48)
├── Pydantic models — ClothingItem, OutfitAnalysis, request models (lines 53–...)
├── SYSTEM_PROMPT — Claude vision instructions (line 74)
├── Commerce constants — AFFILIATE_TAG, RESALE_SUGGESTION_PCT, AWEAR_COMMISSION_PCT
├── Currency — STATIC_FX_RATES_PER_USD, convert_from_usd()
├── Helper functions — convert_from_usd(), affiliate_url(), build_buy_options(), _demo_analysis()
├── Endpoints:
│   GET  /                    → serves static/index.html
│   POST /api/analyze         → photo → Claude Vision → outfit items + buy links
│   POST /api/outfit/generate → wardrobe + occasion → Claude → outfit suggestions
│   POST /api/declutter       → wardrobe → Claude → sell/donate suggestions
│   POST /api/stylist/chat    → message → Claude → stylist reply
│   POST /api/moderate        → comment → Claude → moderation decision
│   POST /api/agent/summary   → meeting summary → email via Google
│   POST /api/agent/schedule  → event data → Google Calendar
│   POST /api/agent/meeting   → meeting request → Google Calendar
└── Static file mount — serves /static/
```

---

## Standard Endpoint Template

```python
class MyRequest(BaseModel):
    field1: str
    field2: list = []
    field3: int = 0  # optional with default

@app.post("/api/my-feature")
async def my_feature(data: MyRequest):
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=800,
            system="Your system prompt here.",
            messages=[{"role": "user", "content": data.field1}],
        )
        result = response.content[0].text.strip()
        return {"result": result, "mode": "live"}
    except Exception:  # noqa: BLE001
        return {"result": _demo_fallback(), "mode": "demo"}
```

**Rules:**
- Always `async def` for endpoints
- Request body = Pydantic BaseModel, never raw dict
- Return plain `dict` — FastAPI serializes it
- AI calls always wrapped in try/except with demo fallback
- Always return `"mode": "live"` or `"mode": "demo"` — frontend reads this

---

## Demo Mode Pattern

Every endpoint that calls Claude must degrade gracefully when the API key is missing or invalid (live pitch, dev env without key):

```python
try:
    # ... call Claude ...
    result["mode"] = "live"
except Exception:  # noqa: BLE001 — auth/api/parse failure → demo fallback
    result = _demo_analysis()   # or your own _demo_X() function
    result["mode"] = "demo"
```

`_demo_analysis()` is at line ~260 — returns a realistic hardcoded `OutfitAnalysis` dict. Add your own `_demo_X()` helper near it for new features.

**The frontend must read `result.mode`** — if it doesn't, users never know they're seeing demo data. Always verify with `grep -n "result\.mode\|data\.mode\|\.mode" static/index.html`.

---

## Claude API Calls

Two patterns used in the codebase:

**Pattern A — Structured output** (when you need a specific schema back):
```python
response = client.messages.parse(
    model=MODEL,
    max_tokens=4000,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": [...]}],
    output_format=OutfitAnalysis,   # Pydantic model
)
result = response.parsed_output.model_dump()
```

**Pattern B — Free text** (when you parse the response yourself):
```python
response = client.messages.create(
    model=MODEL,
    max_tokens=800,
    system="...",
    messages=[{"role": "user", "content": "..."}],
)
text = response.content[0].text.strip()
# Strip markdown fences if Claude wraps JSON:
if text.startswith("```"):
    text = "\n".join(text.split("\n")[1:]).rstrip("`").strip()
import json as _json
return _json.loads(text)
```

**`MODEL`** is defined at line 39 (`"claude-opus-4-8"`). Always use `MODEL`, never hardcode a model name.

**System prompts**: must instruct Claude to respond in the user's language. Template:
```python
"You are AWEAR's AI [role], serving users worldwide. ... "
"Reply in the same language as the user's input (default to English if unsure)."
```

---

## Pydantic Models — Where to Add

Add new request/response models near the top of the file, with the existing models (lines 53–150). Keep them grouped: request models together, response models together.

```python
class MyFeatureRequest(BaseModel):
    wardrobe: list = []          # always default to [] for optional lists
    occasion: str = ""           # "" for optional strings
    limit: int = 10              # sensible defaults

class MyFeatureResponse(BaseModel):
    items: list[dict]
    mode: str                    # always include mode
```

---

## Constants — Where to Add

Top-level constants live between lines 39–150. Pattern:
```python
# One-line comment explaining the business rule, not the code
MY_CONSTANT = 0.15  # per Ayalon's decision doc if product-owned
```

If a constant encodes a business rule (commission rate, price threshold, model name), it belongs at the top — **not** hardcoded inside an endpoint function. This is the single source of truth. See `RESALE_SUGGESTION_PCT` for an example with the decision doc reference.

---

## SQLite Pattern

```python
import sqlite3
conn = sqlite3.connect("awear.db")
cursor = conn.cursor()

# ✅ Always parameterized — never f-string into SQL
cursor.execute("SELECT * FROM items WHERE user_id = ?", (user_id,))
rows = cursor.fetchall()
conn.close()
```

`schema.sql` defines all tables. Read it before writing any query — don't assume column names.

---

## Commerce Layer

```
affiliate_url(url)       → wraps a retailer URL with affiliate tag (line ~174)
build_buy_options(query) → generates shoppable links from a search query (line ~180)
convert_from_usd(amount, currency) → display-only currency conversion (line ~152)
```

`STATIC_FX_RATES_PER_USD` = hardcoded rates, not live FX. Display-only. Don't use for payment math.

New endpoints that return prices: always store/compute in USD (`price_estimate_usd`), convert for display only.

---

## Google Services (Optional)

```python
# These are no-ops if Google creds aren't configured:
create_calendar_event(...)
schedule_agent_meeting(...)
send_summary_email(...)
```

They're imported with a try/except at line ~30. Any new Google feature must follow the same optional pattern — the app must run without Google creds in dev.

---

## Adding a New Endpoint — Checklist

1. Define Pydantic request model (top of file)
2. Write `async def` endpoint with `@app.post("/api/name")`
3. Wrap Claude call in try/except → demo fallback
4. Return `{"...", "mode": "live"}` or `"mode": "demo"`
5. **Wire it up**: `grep -n "/api/name" static/index.html` — must find a fetch call
6. **Field names**: grep frontend for any field you return to verify names match exactly
