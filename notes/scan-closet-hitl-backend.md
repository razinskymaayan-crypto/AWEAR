# Scan→Closet persistence + human-in-the-loop corrections (backend slice)

**Run:** 2026-07-14, steve lane (auto/steve). **Source:** INBOX ★★★ founder directive 2026-07-11 (product-recognition core), items 2/3/4/5 — backend half.
**Craft:** sam (implementation, 2 dispatches). **Review:** fresh-context adversarial diff review (APPROVE; 1 LOW finding fixed same run).

## What shipped (all additive, app.py + tests/ only)
- `ClothingItem.confidence` (high|medium|low) in the Claude Vision structured-output contract + SYSTEM_PROMPT honesty rules (never invent items; low confidence over guessing). All `_DEMO_OUTFITS` items carry the field, so demo mode satisfies the same contract.
- SQLite `closet_items` (persisted closet; keeps `ai_original` JSON snapshot + user `source_url`) and `scan_corrections` (append-only learning ledger: per-field ai_value vs user_value, `rejected` rows, `source_url` rows; keyed with `client_ref` for replay-dedup).
- `POST /api/closet/confirm` — the human gate between scan and closet: persists ONLY user-approved items, records corrections/rejections, idempotent via `(user_key, client_ref)` across BOTH tables (rejected-only batches dedup too — review finding), BE-006 user_key (user_id param, IP fallback), rate-limited 20/min, 1..12 items.
- `GET /api/closet?user_id=&limit=` — persisted closet, newest-first (`created_at DESC, rowid DESC`), lean shape (no ai_original), 60/min.

## Dead ends / decisions
- No server-side "pending scan" state: /api/analyze stays stateless; the client round-trips `ai` + `final` per item into confirm. Simpler, works offline-first.
- Rejections are recorded as ledger rows (field='rejected'), not closet rows — strongest learning signal (AI saw something that wasn't real).
- Rate-limit key on confirm is the client-supplied user_id (pattern-consistent with challenge_complete; app has no auth on these flows). Flagged for a future auth/quota pass — review finding, LOW, deferred.
- Dedup check + insert are separate `_get_db()` blocks — safe single-process (no await between), same documented limitation as the in-memory rate limiter. Deferred with it.

## HANDOFF → mark lane (UI half of the ★★★ directive; couldn't write mark.md/INBOX from steve lane — guard)
1. Post-scan "Did we get it right?" per-item confirm screen: approve / edit (name, category, color, brand, price) / paste source link (`source_url`) / reject. Flag `confidence==='low'` items visually and ask the user to refine — never present a low-confidence guess as fact (founder item 4).
2. On confirm → `POST /api/closet/confirm` `{user_id, client_ref:<stable per scan>, items:[{accepted, ai:<original analyze item>, final:<edited fields>}]}`. Keep localStorage `awear_wardrobe` as the offline/demo cache but hydrate from `GET /api/closet` on load so the closet survives devices/restarts.
3. Verify: check-render + gabbana 8+ on the confirm screen + screenshot.

## Follow-up — CLOSED 2026-07-15 (steve run, sam craft)
`scan_corrections` was write-only; now consumed. `/api/analyze` gained optional `?user_id=` (BE-006, wallet-style IP fallback; rate limit stays IP-keyed) and injects a per-user learning block built by `_corrections_context()` (app.py ~L478) into the LIVE Claude call: confirmed closet brands + per-field "AI said X → user corrected to Y" lines + rejection warnings, deduped, whole-line-truncated at a 1500-char hard cap, fail-open on any DB error (a context failure never breaks a scan). Response reports `corrections_used` (0 on the demo path — demo never used them). 5 new pytests (58/58 green): injection proven via captured parse kwargs, fresh-user no-injection, cap, demo honesty, rejection mention. SYSTEM_PROMPT untouched; additive only.
Remaining follow-ups: (a) tune ROW_LIMIT=60 / cap=1500 if real usage shows drift; (b) frontend must pass `?user_id=` on scan (mark lane — same handoff as the confirm screen above); (c) longer-term: aggregate corrections into eval sets for prompt tuning.

(2026-07-14 pending bookkeeping applied 2026-07-15 by steve run — activity_log row, contributions rows, INBOX annotation all landed.)
