---
name: backend-patterns
description: Orientation and patterns for AWEAR's app.py FastAPI backend (~4,100 lines). Use BEFORE adding a new endpoint, Pydantic model, Claude API call, or SQLite query — covers the endpoint template (BE-006 + rate limit), _get_db()/init_db() data access, startup caches, demo fallback, and where constants live. NOT for renames (use backend-rename-safety), frontend work, or mobile/.
allowed-tools: Read, Grep, Glob, Bash
---

# Backend Patterns — app.py

FastAPI + Pydantic + Anthropic SDK + SQLite. Run: `venv312/bin/uvicorn app:app --reload --port 8000`.
Line numbers below are hints, not truth — the file grows constantly. **Grep is the truth.**

## Orientation (grep, don't scroll)

```bash
grep -n "^@app\." app.py                 # all ~60 endpoints (GET/POST/PATCH/DELETE)
grep -n "class .*(BaseModel)" app.py     # Pydantic models
grep -n "CREATE TABLE" app.py            # live SQLite schema (inside init_db)
```

Rough map: rate limiting (`check_rate_limit`, ~L69) → `MODEL = "claude-opus-4-8"` (~L135) → `SYSTEM_PROMPT` (~L235) → commerce constants (~L271–344) → `_demo_analysis()` (~L434) → AI endpoints (analyze/outfit/declutter/stylist/moderate) → DB layer (`DB_PATH`/`_get_db`/`init_db`, ~L1035+) → startup caches (~L1298) → social/commerce/analytics endpoints → static mount.

⚠️ `schema.sql` is a **PostgreSQL** aspirational schema — it is NOT what runs. The live SQLite tables are the `CREATE TABLE IF NOT EXISTS` statements inside `init_db()` in app.py. Read those before writing any query.

## SQLite Access — the real pattern

```python
DB_PATH = Path("data/awear.db")           # NOT "awear.db" in repo root

def _get_db() -> sqlite3.Connection:      # ~L1038
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row        # dict-like row access: row["col"]
    return conn

# Usage everywhere in the codebase:
with _get_db() as db:
    row = db.execute("SELECT * FROM saves WHERE user_key = ?", (user_key,)).fetchone()
```

- **Always parameterized** (`?`) — never f-string into SQL.
- **New tables go inside `init_db()`** (`CREATE TABLE IF NOT EXISTS ...`). It runs at startup via the `@app.on_event("startup")` handler, before any request. (CLAUDE.md calls it `_init_db()`; the actual function name is `init_db` — grep confirms.)
- **SQLite from day 1** for any user-persisted data — never an in-memory dict (Iron Rule BE-005).

## Startup Caches (read-only fixture data)

`_posts_cache`, `_products_cache`, `_profiles_cache` (~L1298) are loaded once at startup from JSON files by `load_data_files()`. Demo/fixture content is served from these; **user-generated state goes to SQLite**, not into these lists.

## Standard Endpoint Template — every new endpoint

```python
@app.post("/api/my-feature")
async def my_feature(data: MyRequest, request: Request):
    # BE-006 — mandatory identity pattern, exact spelling:
    user_key = (request.client.host if request.client else None) or "anon"
    # Rate limit — mandatory (def check_rate_limit(client_ip, endpoint, limit) ~L69):
    if not check_rate_limit(user_key, "my_feature", 20):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    with _get_db() as db:
        ...
    return {"result": ..., "mode": "live"}   # plain dict; FastAPI serializes
```

Rules:
- `async def` always; request body = Pydantic BaseModel (add near existing models at top of file), never raw dict.
- **BE-006 exactly as written** — older endpoints use the ternary `... if request.client else "unknown"`; new code uses `or "anon"`.
- `check_rate_limit_window(key, endpoint, limit, window)` exists for custom windows.
- **No HTTP calls inside async ASGI endpoints** — never `fetch`/`httpx`/`requests` to your own server; call the function directly (SF-004, CLAUDE.md Iron Rule 5).
- AI calls wrapped in try/except → demo fallback, and always return `"mode": "live"|"demo"` — the frontend reads it.

## Demo Mode Pattern

Every Claude-calling endpoint degrades gracefully when the API key is missing/invalid:

```python
try:
    ...call Claude...
    result["mode"] = "live"
except Exception:  # noqa: BLE001 — auth/api/parse failure → demo fallback
    result = _demo_analysis()   # ~L434; add your own _demo_X() near it
    result["mode"] = "demo"
```

Verify the frontend reads it: `grep -n "\.mode" static/index.html`.

## Constants

Top-level constants live ~L135–344 (`MODEL`, `AFFILIATE_TAG`, `RESALE_SUGGESTION_PCT`, `AWEAR_COMMISSION_PCT`, `STATIC_FX_RATES_PER_USD`). Business rules (rates, thresholds, model name) go at the top with a one-line business comment — never hardcoded inside an endpoint. Always use `MODEL`, never a literal model string.

## Checklist — new endpoint

1. Pydantic request model near existing models
2. `async def` + `@app.post("/api/name")` + `request: Request`
3. BE-006 `user_key` + `check_rate_limit(...)`
4. SQLite via `with _get_db() as db:` — new tables in `init_db()`
5. Claude call (if any) in try/except → `_demo_X()` fallback + `"mode"` field
6. No self-HTTP (SF-004) — direct function calls only
7. Wire it up: `grep -n "/api/name" static/index.html` must hit (see /wire-it-up)
8. Field names: grep frontend for every returned field — names must match exactly
9. curl test the endpoint before declaring done (grep-verified DoD, OW-002)

## More detail

Claude API call patterns (structured `messages.parse` with beta fallback, free-text parsing), currency/commerce layer, Pydantic conventions, and Google services — see [reference.md](reference.md).
