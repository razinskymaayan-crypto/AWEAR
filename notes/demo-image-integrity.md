# Demo image + data integrity (MASTER_PLAN A6 slice)

**Run:** 2026-07-16, steve lane (auto/steve). **Craft:** steve (investigation/verification — CTO domain; no IC dispatched: the fix itself was one line).

## What shipped
- **Fix:** `prod_jk_020` (ARKET PARK Regular Straight Jeans) `image_url` host-swapped
  `public.assets.hmgroup.com` → `media.arket.com` (same asset path). The old host is doubly
  dead — TLS cert hostname mismatch (browsers hard-fail, image never loads) AND 404 behind it.
  In the demo shop this rendered as the line-art `imgFallback()` icon instead of a product photo.
  New URL verified: `image/jpeg`, 440KB, visually confirmed the correct product (mid-blue straight
  jeans, clean catalog shot). Repo-wide grep: the dead host appeared exactly once.
- **`scripts/data_integrity_check.py`** — structural audit of static/data: orphan `items_tagged`
  (BE-TAG-INTEGRITY), products missing image+search_query, insane prices (`price_estimate_usd`),
  unresolved post authors, duplicate product ids. Fast, no network. **Enforced** by new
  `tests/test_data_integrity.py` (OW-006: a check without enforcement is a recommendation).
- **`scripts/check_image_urls.py`** — pre-demo liveness sweep of ALL 251 external image URLs
  (products + posts + profile avatars), browser-like headers, 16-way concurrent, catches
  hotlink-blocking/404/TLS/html-error-page-with-200. Manual tool (network + ~30s), NOT in CI.
  Run it before any investor demo: `python3 scripts/check_image_urls.py`.

## Verified
- `python3 scripts/data_integrity_check.py` → CLEAN (200 products / 40 posts / 20 profiles)
- `python3 scripts/check_image_urls.py` → CLEAN — all 251 URLs load (was 1 broken)
- `python3 -m pytest` → 59 passed (58 existing + 1 new)
- `python3 -m py_compile app.py scripts/*.py` OK · `npm run check-render` → render OK

## Dead ends / notes
- `media.arket.com` 404s on bare `Mozilla/5.0` UA without an `Accept` header — the checker uses
  full browser-like headers on purpose; a plain `curl <url>` false-negatives on this CDN.
- Considered making MATCH-stage real (loop table) — blocked: `calcCompatScore` lives in
  `static/app.js` (mark's lane). Left for a coordinated cross-lane pass.

## Bookkeeping blocked by session permissions (writes under `.claude/` denied this run)
A future steve-lane run (or jeff) should append these two rows verbatim:

`.claude/agents/activity_log.md`:
| 2026-07-16 | steve (steve lane) | auto/steve / static/data/products.json + scripts/ + tests/ | done | MASTER_PLAN A6 demo-reliability slice: audited ALL static/data (200 products, 40 posts, 20 profiles) + swept all 251 external image URLs live — found exactly 1 broken product photo (prod_jk_020 ARKET jeans: dead public.assets.hmgroup.com host, bad TLS cert AND 404 behind it → line-art fallback in the demo shop). Fixed by host-swap to media.arket.com (verified image/jpeg + visually confirmed correct product). Shipped 2 permanent tools: scripts/data_integrity_check.py (orphan tags / images / prices / authors / dup ids — enforced by new tests/test_data_integrity.py, no network) + scripts/check_image_urls.py (manual pre-demo 251-URL liveness sweep). 59/59 pytests, py_compile + check-render green. No IC dispatched — investigation/verification (CTO domain) + a one-line data fix. |

`.claude/agents/contributions/2026-07-16.md`:
| 08:45 | steve | steve | ~45k | A6 data+image integrity audit, prod_jk_020 fix, 2 checker scripts + pytest gate |

Also: CI_FAILURES.md jeff-merge BASE-patch re-check done 2026-07-16 — `grep -c 'BASE='` on main
jeff-merge.yml = 0 at 66f008c, patch STILL NOT applied, not re-pinging (founder pinged 3×;
NEEDS_YOU line stands). Couldn't append the re-check line (same permission block).
