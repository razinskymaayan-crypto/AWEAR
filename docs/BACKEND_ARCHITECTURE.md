# AWEAR — Backend Architecture
> מקביל ל-VISUAL_VISION.md עבור הבאקנד. Single source of truth לכל החלטה מבנית בשרת.
> **Owner decisions:** Schema = סאם | Integration = אורן | Architecture = סטיב
> *עודכן: 2026-06-21*

---

## חלק א׳ — Stack ואוריינטציה

```
Backend:   FastAPI (app.py ~1300 lines)
Database:  SQLite (data/awear.db)
Server:    venv312/bin/uvicorn app:app --reload --port 8000
Dashboard: tools/dashboard_server.py (port 8001)
```

**קבצים מרכזיים:**
| קובץ | תפקיד |
|------|--------|
| `app.py` | כל הlogic — endpoints, DB, cache, Claude calls |
| `schema.sql` | schema definition (source of truth) — owner: סאם |
| `data/awear.db` | SQLite runtime DB (gitignored) |
| `data/products.json` | Product seed data — loaded to `_products_cache` at startup |
| `data/profiles.json` | Profile seed data — loaded to `_profiles_cache` at startup |
| `data/posts.json` | Posts seed data — loaded to `_posts_cache` at startup |

---

## חלק ב׳ — SQLite Patterns (BE-004, BE-005)

### Pattern מחייב לכל store חדש

```python
# 1. _init_db() — always in startup event
def _init_db():
    db = _get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS my_table (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    db.commit()

# 2. _get_db() — always use row_factory
def _get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db

# 3. DB_PATH — always create parent directory
DB_PATH = Path("data/awear.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
```

**כלל ברזל (BE-005):** saves, likes, comments, wardrobe items = SQLite מיום 1. אף פעם לא `dict = {}`.
**כלל ברזל (BE-004):** "האם נתון זה צריך לשרוד restart?" אם כן/אולי → SQLite. לא in-memory.

---

## חלק ג׳ — Endpoint Template (MG-005)

כל endpoint חדש חייב לכלול:

```python
@app.post("/api/example")
async def example_endpoint(request: Request, body: ExampleBody):
    # 1. MG-005 — always
    user_key = (request.client.host if request.client else None) or "anon"

    # 2. Rate limiting — always
    if not check_rate_limit(user_key, "example", limit=20):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # 3. Demo fallback — for AI endpoints
    if not ANTHROPIC_API_KEY:
        return {"result": DEMO_FALLBACK, "fallback": True}

    # 4. Logic — call functions directly, no HTTP inside async (SF-004)
    result = do_something(body.data)

    return {"result": result}
```

**Iron Rule SF-004:** אסור HTTP calls בתוך async ASGI endpoints — קרא functions ישירות.
**Iron Rule MG-005:** `user_key = (request.client.host if request.client else None) or "anon"` — תמיד.

---

## חלק ד׳ — Rate Limiting

```python
# קיים ב-app.py — use it
check_rate_limit(client_ip: str, endpoint: str, limit: int) -> bool
```

| Endpoint Type | Recommended Limit |
|---------------|------------------|
| AI/Claude calls | 10-20/min |
| Read endpoints | 60/min |
| Write endpoints | 30/min |
| Auth endpoints | 5/min |

---

## חלק ה׳ — Startup Caches

מוכן בהפעלה (לא DB — seed data בלבד):

```python
_posts_cache     # list of posts from data/posts.json
_products_cache  # list of products from data/products.json
_profiles_cache  # list of profiles from data/profiles.json
```

**שימוש:** filter בזיכרון לlist returns מהירים. אל תשנה את הcache ב-runtime — זה read-only.

---

## חלק ו׳ — Commerce & Currency Layer

**החלטת board (2026-06-18, איילון):** מטבע פנימי = **USD בלבד**.

```python
# שדות מחיר חייבים להיות:
price_usd: float       # ✓ נכון
price_estimate_usd: float  # ✓ נכון
price_ils: float       # ✗ שגוי — לא קיים יותר
price_estimate_ils: float  # ✗ שגוי — גרם ל-incident OW-001
```

**FX Policy:**
- v1: static table בלבד (ללא live API — החלטת board)
- live FX API: דורש אישור board מפורש
- FX rates table: אחריות אורן (Integration)

**Resale Economics:**
- Suggested resale price: 50% of original
- AWEAR commission: 15% of sale

**Creator Credits (ledger):**
- append-only — אסור לשנות/מחוק שורות קיימות
- idempotent — כל credit עם unique `order_id`
- Schema: `id TEXT PK, user_id, order_id, amount_usd, type, created_at`

---

## חלק ז׳ — Moderation API (SF-003)

```python
# /api/moderate — AWEAR content moderation via Claude
# Status: FAIL-OPEN — P0 לפני production

# הבעיה:
if not ANTHROPIC_API_KEY:
    return {"approved": True, "fallback": True}  # כל תוכן עובר!

# מה נדרש לפני deploy:
# 1. Steve/Jeff: set ANTHROPIC_API_KEY בprod env
# 2. Ayalon: sign-off על severity thresholds (plans/moderation_thresholds_proposal.md)
# 3. Shira: curl test + תיעוד response לפני "done"
```

**Thresholds status:** Pending-Approval איילון — ראה `plans/moderation_thresholds_proposal.md`.

---

## חלק ח׳ — Schema Ownership

| אחריות | Owner | מה זה אומר |
|--------|-------|------------|
| Schema design & migrations | **סאם** | שינוי ב-schema.sql = סאם מאשר |
| Integration cross-layer | **אורן** | חיבור frontend/backend/mobile |
| Architecture decisions | **סטיב** | patterns, security, infra |

**Iron Rule BE-003:** סאם ואורן לא מתחלפים תחת לחץ. שינוי הגבול = escalate לסטיב.

---

## חלק ט׳ — Claude API Integration

```python
# Model: claude-haiku-4-5-20251001 (fast, cheap — for real-time features)
# Client: anthropic.Anthropic() — sync client, not async

# Demo fallback pattern — חובה לכל Claude endpoint:
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    return DEMO_RESPONSE  # hardcoded fallback, not error
```

**Features using Claude:**
- `/api/stylist` — AI outfit recommendations
- `/api/marketplace/assist` — filter assistant
- `/api/moderate` — content moderation (fail-open כשkey חסר)

---

## חלק י׳ — Iron Rules Summary (Backend)

| Rule | Code | מה עושים |
|------|------|---------|
| Rename = 3 שכבות | OW-001 | `backend-rename-safety` skill לפני כל rename |
| "הושלם" ≠ "נבדק" | OW-002 | curl test חובה לכל endpoint חדש |
| SQLite מיום 1 | BE-004/005 | אף dict לנתוני משתמש |
| MG-005 pattern | MG-005 | `user_key` בכל endpoint |
| לא HTTP ב-async | SF-004 | call functions directly |
| Schema owner | BE-003 | סאם בלבד משנה schema |
| Moderation fail-open | SF-003 | P0 לפני production |
