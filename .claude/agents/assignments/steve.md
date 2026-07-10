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

## [x] P1 — IDOR + plaintext-token auth: anyone can read any email / edit any profile
> DONE 2026-07-06 (sam, branch auto/steve): opaque session tokens (`secrets.token_urlsafe(32)`) in new SQLite `sessions` table, issued at register+login (response shape unchanged); GET+PATCH `/api/auth/me/{user_id}` now require `Authorization: Bearer` and assert token-subject == path id (401 missing/invalid, 403 mismatch). 8 new pytests, fail-before proven (5 vuln tests return 200 on old code), suite 30/30. No TTL yet (later cycle). Follow-up for varan's lane: `mobile/screens/EditProfileScreen.js:19` PATCHes without a Bearer header — must store the login token and send it (mobile is dormant; web SPA never calls these endpoints, unaffected).
**Evidence:** `GET /api/auth/me/{user_id}` returns `email` for any id, `PATCH /api/auth/me/{user_id}` edits
any user — no caller verification; the "token" is just the plaintext `user_id` (`app.py:2168-2216`).
**Fix:** issue a real opaque session token at login/register (store `token→user_id` in SQLite); require it
(header `Authorization: Bearer`) and assert token-subject == the `{user_id}` in the path. **Test:** user A's
token cannot PATCH user B; missing/junk token → 401.

## [x] P1 — Passwords are unsalted SHA-256
> DONE (merged to main before 2026-07-10; checkbox was stale — verified in code by steve 2026-07-10): `_pw_hash` is bcrypt with per-user salt (`app.py:2187`), legacy SHA-256 hashes transparently re-hashed at login, `bcrypt>=3.2` in requirements.txt.
**Evidence:** `_pw_hash` = plain SHA-256 (`app.py:2097`). Rainbow-table / GPU-brute-forceable.
**Fix:** switch to `bcrypt` (add to requirements.txt) with per-user salt; keep a migration path for existing
rows. **Test:** same password → different stored hashes; verify() still authenticates.

## [x] P2 — Comments & notifications are in-memory dicts (BE-005): wiped on every restart
> DONE (merged to main 2026-07-10 18:06Z, commit "fix(social): P2 BE-005"; checkbox was stale — verified by steve 2026-07-10): comments + notifications now SQLite tables; `_comments_store`/`_notifications_store` grep 0 hits in app.py.
**Evidence:** `_comments_store` / `_notifications_store` (`app.py:1784, 2044`). User-persisted data must be SQLite.
**Fix:** move both to SQLite tables (mirror the likes/follows pattern already in the file). **Test:** POST a
comment → simulate restart (re-open DB) → comment still there.

## [x] P2 — Moderation fails OPEN silently + AI model id unverified
> DONE 2026-07-10 (sam, branch auto/steve): `/api/moderate` now returns `mode` = live|demo|infra_error (no-key demo stays fail-open per SF-003; key-configured-but-call-failed fails CLOSED); public comments on infra error stored `status='held'` and excluded from GET (text not lost, not published); `/api/scan-health` extended (OW-009) with `moderation` + `startup_smoke`; startup makes ONE max_tokens=1 smoke call against MODEL only when a key is set (never in CI) and logs LIVE-vs-DEMO loudly. 4 new pytests (3 fail-before proven — `mode`/`status`/scan-health keys didn't exist), suite 42/42.
**Evidence:** `/api/moderate` returns `{harmful:false}` on any exception (`app.py:1018`); with no
`ANTHROPIC_API_KEY` all filtering is off and nothing surfaces it. Also the model id `claude-opus-4-8`
(`app.py:135`) is never smoke-tested — if wrong, EVERY AI call silently returns demo data as "real."
**Fix:** for public content, fail-CLOSED (hold/flag) on moderation infra failure; add a startup smoke-call
that logs LIVE-vs-DEMO loudly and exposes it on `/api/scan-health`. **Test:** moderation infra error on a
public comment → not silently allowed.

## Lane rules
Own ONLY app.py, schema.sql, static/data/*.json, scripts/*.py, tests/. Every fix ships with a pytest that
FAILS before and PASSES after (the jeff-merge pytest gate enforces it). One item per run; check it off here.
