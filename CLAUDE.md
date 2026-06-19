# AWEAR — Agent Briefing (auto-loaded, do not remove)

## Project
Fashion social app. Stack: FastAPI (`app.py`) + Vanilla JS SPA (`static/index.html`, ~5500 lines) + React Native (`mobile/`). DB: SQLite (`data/awear.db`). Server: `venv312/bin/uvicorn app:app --reload --port 8000`.

## Iron Rules — violation = task rejected by Gabbana/Steve
1. **No emoji in UI chrome** — `icon()` in JS templates, inline SVG in static HTML (DS-008)
2. **No hardcoded hex** — `var(--token, exact-fallback)` always (DS-004)
3. **No `font-size` on image containers** — remove it (DS-009)
4. **SQLite from day 1** for any user-persisted data — not in-memory dict (BE-005)
5. **No HTTP calls inside async ASGI endpoints** — call functions directly (SF-004)
6. **Rename = grep 3 layers**: `app.py` + `static/index.html` + `mobile/` (OW-001)
7. **Worktrees under `AWEAR/worktrees/`** — never in `~/` directly
8. **DoD = grep verified** — "I think it works" is not DoD (OW-002)
9. **MG-005**: `user_key = (request.client.host if request.client else None) or "anon"` — always

## Design tokens (Mediterranean Modern — `static/tokens.css` is source of truth)
```
--bg:#0e0c0f    --surface:#161318   --card:#1e1a22   --card-hover:#262030
--fg:#f0ecf5    --muted:#8a8498     --line:#2e2836   --text:#fbfbfd (alias of --fg)
--accent:#e8526a  --accent2:#c4855a  --accent3:#7a6af0
--success:#52c97a  --warning:#e8a84a  --danger:#e05252

--t-micro:11px  --t-caption:12px  --t-small:13px  --t-body:14px  --t-h3:15px
--t-lead:17px   --t-title:20px    --t-h2:18px     --t-h1:24px    --t-display:32px

--space-1:4px  --space-2:8px  --space-3:12px  --space-4:16px  --space-6:24px
--r-xs:6px  --r-sm:10px  --r-md:14px  --r-lg:20px  --r-xl:28px  --r-pill:999px
```
> Note: token names `--t-sm`, `--t-md`, `--t-lg` do **not** exist — use `--t-small`, `--t-h3`, `--t-lead`.

## Key file paths
| What | Where |
|------|-------|
| Design tokens (web) | `static/tokens.css` |
| Token mirror (RN) | `mobile/theme/tokens.js` (imports from `awear-tokens.json`) |
| Design standards | `docs/DESIGN_STANDARDS.md` |
| Domain learnings | `agents/learnings-ds.md` / `learnings-be.md` / `learnings-mb.md` / `learnings-sf.md` / `learnings-mg.md` |
| Activity log | `agents/activity_log.md` (last 20 entries — check for concurrent file edits) |
| Specs / plans | `agents/plans/` |
| Archive log | `agents/activity_log_archive.md` |

## Before starting — 3 steps, always
1. **Check** `agents/activity_log.md` last 5 entries — is anyone else editing the same file?
2. **Read** `agents/learnings-[your-domain].md` — only your domain file, **never** the full `agents/learnings.md`
3. **Grep before Read** — for large files (`index.html`, `app.py`), grep the target first, then read only the relevant lines with `offset`+`limit`

## Editing discipline
- **Trust the Edit tool** — it errors on failure. Do NOT re-read a file after editing to verify.
- **Grep to verify, not Read** — `grep -n "your_change" file` costs ~10 tokens; re-reading costs thousands.

## SPA orientation (static/index.html — 5500 lines)
- View routing: `showView('home'|'feed'|'profile'|'wardrobe'|'market'|'book'|'closet')`
- `icon(name, size)` works **only in JS template literals** — never in static HTML
- ICONS object has 40+ icons — check before adding new SVG
- Event delegation: most clicks use `data-action` attributes
- TDZ risk: global `const`/`let` must be declared before first `renderXxx()` call
- Use `spa-navigation` skill for a function/line map before editing

## Backend orientation (app.py — ~1300 lines)
- `_posts_cache`, `_products_cache`, `_profiles_cache` — loaded at startup from JSON
- `_get_db()` returns SQLite connection with `row_factory = sqlite3.Row`
- `_init_db()` runs at startup — add new tables here
- Rate limiting: `check_rate_limit(client_ip, endpoint, limit)` — add to new endpoints
- All new endpoints need MG-005 pattern for `user_key`

## Mobile orientation (mobile/)
- Tokens: `import { color, typography, spacing, radius } from '../theme/tokens'`
- i18n: `import { t } from '../i18n'` (not `useTranslation` hook)
- API base: `const API_BASE = 'http://localhost:8000'`
- Navigation: Stack.Navigator wraps Tab.Navigator (per `onboarding_navigation_plan.md`)
- Touch targets: `minHeight: 44` on all interactive elements

## Activity log format (append only)
```
| YYYY-MM-DD | agent | branch/file | status | short description |
```
