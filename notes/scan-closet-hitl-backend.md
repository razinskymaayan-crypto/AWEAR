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

## Follow-up (future cycle, noted by sam)
`scan_corrections` is write-only so far — needs a consumer (analytics / prompt-tuning job) to make the signal actionable.

## PENDING BOOKKEEPING (all .claude/** writes were permission-blocked this run — engine/next agent: apply verbatim, then delete this section)
`.claude/agents/activity_log.md` row:
| 2026-07-14 | sam (steve lane) | auto/steve / app.py + tests/ | done | Founder ★★★ backend slice: persistent scan→closet + HITL. ClothingItem.confidence (high/med/low) + never-invent prompt rules; SQLite closet_items (ai_original snapshot, source_url) + scan_corrections learning ledger (per-field ai-vs-user diffs, rejections, client_ref replay-dedup incl. rejected-only batches — adversarial-review finding fixed); POST /api/closet/confirm (HITL gate, BE-006, idempotent, 20/min) + GET /api/closet (60/min, newest-first). 11 new pytests, 53/53 green, py_compile+check-render OK. UI half handed to mark lane — see notes/scan-closet-hitl-backend.md. |

`.claude/agents/contributions/2026-07-14.md` rows:
| 08:55 | sam | steve | ~211k | Implemented persistent closet_items + scan_corrections tables, POST /api/closet/confirm + GET /api/closet, confidence in vision contract, 11 pytests (2 dispatches incl. dedup-gap fix) |
| 08:45 | claude (reviewer) | steve | ~49k | Fresh-context adversarial diff review: APPROVE, 3 LOW findings (1 fixed: rejected-only client_ref replay skewed scan_corrections; 2 deferred+documented) |

INBOX ★★★ item annotation (backend half done; UI half = mark): see HANDOFF section above.
