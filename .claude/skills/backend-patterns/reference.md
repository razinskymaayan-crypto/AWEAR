# Backend Patterns — Reference (detail relocated from SKILL.md)

Line numbers are hints — grep is the truth.

## Claude API Calls

Two patterns used in the codebase:

**Pattern A — Structured output** (when you need a specific schema back). The live code (~L499–511 in `/api/analyze`) tries the stable namespace first, then falls back to beta — some SDK versions only ship `parse` under `client.beta.messages`:

```python
parse_args = dict(
    model=MODEL,
    max_tokens=4000,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": [...]}],
    output_format=OutfitAnalysis,   # Pydantic model
)
try:
    response = client.messages.parse(**parse_args)
except (AttributeError, TypeError):
    response = client.beta.messages.parse(**parse_args)
if response.parsed_output is None:
    raise ValueError("no parsed output")
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

**`MODEL`** is defined near the top (`MODEL = "claude-opus-4-8"`, ~L135). Always use `MODEL`, never hardcode a model name.

**System prompts**: must instruct Claude to respond in the user's language. Template:
```python
"You are AWEAR's AI [role], serving users worldwide. ... "
"Reply in the same language as the user's input (default to English if unsure)."
```

## Pydantic Models — Where to Add

Add new request/response models near the top of the file, with the existing models (grep `class .*(BaseModel)`). Keep them grouped: request models together, response models together.

```python
class MyFeatureRequest(BaseModel):
    wardrobe: list = []          # always default to [] for optional lists
    occasion: str = ""           # "" for optional strings
    limit: int = 10              # sensible defaults

class MyFeatureResponse(BaseModel):
    items: list[dict]
    mode: str                    # always include mode
```

## Commerce Layer

```
convert_from_usd(amount_usd, to_currency) → display-only currency conversion (~L316)
affiliate_url(url)       → wraps a retailer URL with affiliate tag (~L338)
build_buy_options(query) → generates shoppable links from a search query (~L344)
```

`STATIC_FX_RATES_PER_USD` (~L305) = hardcoded rates, not live FX. Display-only. Don't use for payment math.

New endpoints that return prices: always store/compute in USD (`price_estimate_usd`), convert for display only. (The `price_estimate_ils`→`usd` rename incident is documented in the backend-rename-safety skill.)

## Google Services (Optional)

```python
# These are no-ops if Google creds aren't configured:
create_calendar_event(...)
schedule_agent_meeting(...)
send_summary_email(...)
```

They're imported with a try/except (~L114, `from google_services import ...`). Any new Google feature must follow the same optional pattern — the app must run without Google creds in dev.

## Endpoint Families (grep `^@app\.` for the live list — ~60 endpoints)

- **AI**: `/api/analyze`, `/api/outfit/generate`, `/api/declutter`, `/api/stylist/chat`, `/api/moderate`, `/api/marketplace/assist`
- **Fixture-backed reads**: `/api/products`, `/api/posts`, `/api/profiles`, `/api/categories`, `/api/search`
- **Social (SQLite)**: likes, follows, saves, comments, stories, notifications
- **Auth**: `/api/auth/register|login|me`
- **Analytics**: `/api/analytics/*` (wardrobe, wear, summary, wrapped, seasons)
- **Commerce**: `/api/orders`, `/api/wallet`, `/api/wishlist/*`, `/api/bookings`
- **Agent/Google**: `/api/agent/summary|schedule|meeting`
- **Ops**: `/api/scan-health`, `/api/admin/reload-products`, `/api/weather`, `/api/daily-log*`
