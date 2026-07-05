# Backend lane (steve) — assignments

> Source: Fable-5 backend audit, 2026-07-05 (founder-approved). Each item cites file:line.
> Do them TOP-DOWN, one per run, each with a pytest that proves the fix. Verify: `python -m pytest -q` green.

## [x] P0 — Creator Wallet is disconnected: every creator sees $0 (flagship money feature broken)
> DONE 2026-07-05 (sam, branch auto/steve): `/api/wallet` accepts `?user_id=` and reads credits by profile id (IP fallback kept); balance = SUM over full ledger, LIMIT 50 only on history. 3 new pytests (fail-before/pass-after proven), suite 22/22. Follow-up for mark's lane: wallet UI must pass `?user_id=<creator id>`.
**Evidence:** credits are inserted with `user_key = order.influencer_id` (a profile id) at `app.py:3582`,
but `GET /api/wallet` reads `WHERE user_key = ?` using the caller's **IP** (`app.py:3680`). The two
identities never match → balance is always $0. AND balance sums only `LIMIT 50` rows (`app.py:3684/3693`).
**Fix:** (a) let the wallet be queried for a specific creator — accept `?user_id=` and read credits by that
id (falling back to IP only when absent); (b) compute balance with `SELECT SUM(amount_usd)` over ALL the
creator's credits, keep LIMIT only on the displayed history list.
**Test (add to tests/):** POST an order with `influencer_id="user_x"` → `GET /api/wallet?user_id=user_x`
→ balance == 5% of the order amount; add 60 credits → balance sums all 60, not 50.

## [ ] P1 — IDOR + plaintext-token auth: anyone can read any email / edit any profile
**Evidence:** `GET /api/auth/me/{user_id}` returns `email` for any id, `PATCH /api/auth/me/{user_id}` edits
any user — no caller verification; the "token" is just the plaintext `user_id` (`app.py:2168-2216`).
**Fix:** issue a real opaque session token at login/register (store `token→user_id` in SQLite); require it
(header `Authorization: Bearer`) and assert token-subject == the `{user_id}` in the path. **Test:** user A's
token cannot PATCH user B; missing/junk token → 401.

## [ ] P1 — Passwords are unsalted SHA-256
**Evidence:** `_pw_hash` = plain SHA-256 (`app.py:2097`). Rainbow-table / GPU-brute-forceable.
**Fix:** switch to `bcrypt` (add to requirements.txt) with per-user salt; keep a migration path for existing
rows. **Test:** same password → different stored hashes; verify() still authenticates.

## [ ] P2 — Comments & notifications are in-memory dicts (BE-005): wiped on every restart
**Evidence:** `_comments_store` / `_notifications_store` (`app.py:1784, 2044`). User-persisted data must be SQLite.
**Fix:** move both to SQLite tables (mirror the likes/follows pattern already in the file). **Test:** POST a
comment → simulate restart (re-open DB) → comment still there.

## [ ] P2 — Moderation fails OPEN silently + AI model id unverified
**Evidence:** `/api/moderate` returns `{harmful:false}` on any exception (`app.py:1018`); with no
`ANTHROPIC_API_KEY` all filtering is off and nothing surfaces it. Also the model id `claude-opus-4-8`
(`app.py:135`) is never smoke-tested — if wrong, EVERY AI call silently returns demo data as "real."
**Fix:** for public content, fail-CLOSED (hold/flag) on moderation infra failure; add a startup smoke-call
that logs LIVE-vs-DEMO loudly and exposes it on `/api/scan-health`. **Test:** moderation infra error on a
public comment → not silently allowed.

## Lane rules
Own ONLY app.py, schema.sql, static/data/*.json, scripts/*.py, tests/. Every fix ships with a pytest that
FAILS before and PASSES after (the jeff-merge pytest gate enforces it). One item per run; check it off here.
