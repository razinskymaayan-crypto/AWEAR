# User Survey — Home "Today's Look" hero carousel (post-fix confirmation)

**Date:** 2026-06-28
**Target:** Home screen → "Today's Look" hero carousel (the first thing investors see in the <5-min demo)
**Type:** Confirmation survey after a big visual fix (Gabbana 8.5 PASS → quick survey per autopilot rule)
**Panel:** ~100 experts synthesized in aggregate — fashion-app product/UX experts + target users (16–50). Steered by Ayalon (product) and Gabbana (design).
**Screenshot:** `/tmp/home_after.png` (after) · charts: `/tmp/survey1.png`, `/tmp/survey2.png`

## What changed
The carousel previously showed (1) a **blank white tile** — ds1 "White Ribbed Crop Top" used an H&M URL now returning 403 (hotlink-blocked), and the garment was white-on-white anyway — and (2) a **random irrelevant street/metal-sculpture photo** — ds3/ds12/ds13 had no `image_url`, so `_productImgUrl()` fell back to `loremflickr.com` random photos. Audit also found ds4–ds7 catalog URLs had silently rotted to the wrong products.

**Fix (Mark's direction — get the demo off live CDNs):** bundled all 13 `_DEMO_CLOSET_ITEMS` images locally in `static/img/closet/ds1..ds13.jpg` (~1.4MB, on-model/lifestyle for hero items, never white-on-white). Broadened the `_productImgUrl()` guard to accept local `/`-prefixed paths. Zero CDN-rot risk during the live demo (MASTER_PLAN A6).

## Metrics (1–10)

| Metric | Before (est.) | After |
|--------|:---:|:---:|
| Overall satisfaction | 3 | **8** |
| First impression | — | 8 |
| Image relevance | — | 8 |
| Trust / credibility (real product vs broken prototype) | — | 9 |
| Aspirational pull ("I want to use this") | — | 8 |

**Design gate:** Gabbana 8.5/10 PASS — zero blank tiles, zero irrelevant photos confirmed in-browser.

Charts:
- `survey1.png` — Before (3) vs After (8) overall satisfaction
- `survey2.png` — After-fix expert scores across 5 dimensions

## Conclusions
- **Decisive improvement:** the screen moved from broken-prototype (~3) to ship-worthy product (~8). **No severe (<4) finding.**
- **Biggest win = credibility (9/10):** on-model lifestyle imagery instantly reads as a real, editorial product rather than a prototype with placeholder art.
- **Reliability win:** self-hosting kills the entire class of loremflickr/CDN-rot failures that caused the original P0 — the live demo can no longer break on a dead retailer URL.

### Fixed now (this run)
- Blank white tile (ds1) → on-model white tank.
- Random sculpture photo (ds3/ds12/ds13) → relevant on-model garments.
- Rotted catalog URLs (ds4–ds7) → correct local images.

### Proposed to IDEAS.md (polish, non-blocking — P1)
- Title/description copy truncates mid-word ("White Ribbed Crop T…", "Off-duty energy with just the right amoun…") — fit copy or clean ellipsis + line-height.
- Same blue-denim bottom repeats across Weekend Vibes and Street Style cards — vary the bottom/crop so looks read as distinct.
- Hero crop/lighting inconsistency between cards (golden-hour warm vs cool daylight; full-body vs portrait) — align framing + a unified warm-neutral grade (Gabbana P1 #1/#2; highest visual ROI before the demo).
- Heavy pink glow on the "Wore it" button competes with the hero carousel above it.
