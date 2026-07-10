# P2 — Comments & notifications → SQLite (steve lane, 2026-07-10)

Task: assignments/steve.md item 4 — `_comments_store`/`_notifications_store` in-memory dicts (BE-005) → SQLite, pytest fail-before/pass-after.

## Result — DONE (sam)
- `app.py`: new `comments` + `notifications` tables in `init_db()` (+ `idx_comments_post_id`, `idx_notifications_user_id`); `add_comment`, `get_comments`, `_emit_notification`, `get_notifications`, `mark_all_read` rewritten on `_get_db()`; dead dicts deleted. Response shapes preserved field-by-field (`read` returned as real JSON bool via `bool()` cast; id formats `c_{post_id}_{n}` / `n_{user_id}_{n}` kept via COUNT).
- `tests/test_app.py`: +5 pytests (comment persists as a real SQLite row visible from a fresh connection; pagination/total; unknown-post empty; like → notification → read-all persists; empty-user_id skip). Fail-before proven on a temp copy of OLD app.py loaded via `spec_from_file_location` with `__file__` asserted (guarding the sys.path gotcha from notes/p1-bcrypt-passwords.md): old code returned 200 but no `comments` table existed in the DB.
- `schema.sql` untouched — checked: it's the aspirational PostgreSQL schema (different `comments` shape, no `notifications`), documentation-only, doesn't mirror `init_db()`.
- Consumer grep (read-only): `api/notifications` / post-`/comments` endpoints have ZERO consumers in `static/index.html` and `mobile/` — pure backend persistence, no rename risk. Wiring the notification bell/comment sheet to these endpoints is an open follow-up for mark's lane.
- Semantic delta (flagged, no consumer affected): old `unread_only=True` sliced newest-`limit` BEFORE filtering (could return fewer than `limit`); new SQL filters-then-limits — strictly better, worth one line if/when frontend wires in.
- Verified (steve, independently): `python3 -m py_compile app.py tests/test_app.py` OK; `python3 -m pytest tests/` → **38 passed** (33 prior + 5 new); `npm run check-render` → render OK; `git diff origin/main...HEAD --name-only` → in-lane files only.

## PENDING META-UPDATES — `.claude/` writes STILL permission-blocked (re-confirmed 2026-07-10 by steve, Edit denied on assignments/steve.md; original NEEDS_YOU.md entry 2026-07-05). Apply when writes reopen — NOTE: the bcrypt run's pending block in notes/p1-bcrypt-passwords.md is ALSO still unapplied; do both.

1. `.claude/agents/assignments/steve.md` — check off item 4:
   `## [x] P2 — Comments & notifications are in-memory dicts (BE-005): wiped on every restart`
   `> DONE 2026-07-10 (sam, branch auto/steve): comments + notifications SQLite tables in init_db (indexed); 5 endpoints/helpers moved to _get_db(); response shapes unchanged; 5 new pytests, fail-before proven (old code: 200 but no table in DB), suite 38/38. Endpoints have zero frontend consumers yet — wiring = follow-up for mark's lane.`

2. `.claude/agents/activity_log.md` — append:
   `| 2026-07-10 | sam (steve lane) | auto/steve / app.py + tests/test_app.py | done | P2 BE-005: comments + notifications in-memory dicts -> SQLite tables (shapes preserved, read-> bool cast); 5 new pytests, fail-before proven, suite 38/38 |`

3. `.claude/agents/contributions/2026-07-10.md` — append:
   `| 18:05 | sam | steve | ~102k | comments+notifications SQLite migration: init_db tables, 5 call sites, 5 pytests with fail-before proof |`
   `| 18:20 | steve | steve | ~35k | rejection/self-heal triage, health check, task pick, delegation spec, independent verify (pytest/check-render/lane-diff), commit |`
