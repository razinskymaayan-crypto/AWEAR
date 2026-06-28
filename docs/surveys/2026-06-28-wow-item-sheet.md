# Survey — "WOW" Item Sheet (feed-tagged-item bottom sheet)

**Date:** 2026-06-28
**Target:** The bottom sheet shown when a user taps a tagged item inside a feed post — now complete with all three "WOW" chunks (% closet-match band → stylist looks from your closet → new "Where it sells" buy-to-source block).
**Trigger:** Big visual change to a demo-critical screen (chunk 3 "Where it sells" just shipped, Gabbana 8.5 PASS) — survey run to confirm the change measurably improved the screen.
**Panel:** ~100 synthesized expert reviewers (fashion-commerce PMs, conversion/UX specialists, resale-marketplace operators), steered via the `ayalon` product subagent. Aggregate synthesis, not 100 separate passes.
**Chart:** `/tmp/survey_wow.png` (sent to founders' Telegram).

## Metrics (1–10)

| Metric | Score |
|--------|-------|
| WOW / first impression | 8.1 |
| Purchase intent (drives tap-to-buy) | 7.0 |
| Clarity of closet-match value | 8.4 |
| Trust in buy-source + resale section | 6.3 |
| Competitive benchmark (vs IG Shopping / Pinterest / LTK) | 7.6 |
| **Aggregate** | **7.5** |

## Conclusions

- **Verdict: completing chunk 3 was a net improvement.** Panel's counterfactual for "match band + looks alone" ≈ 7.3 aggregate; adding "Where it sells" lifted WOW and the competitive benchmark by closing the "…and you can actually buy it" loop and adding the circular-fashion (resale) signal investors will quote. It is, however, the weakest of the three chunks.
- **Strengths:** (1) the closet-match band is a category-defining hook — it leads with *you*, not the SKU; (2) a coherent top-to-bottom narrative — "this matches you → here's how to wear it → here's where to get it" — that no competitor tells in one surface; (3) restraint in the resale signal (one quiet row reads as values, not a discount banner).
- **Issues (ranked):** (1) synthetic-data tells in "Where it sells" — text-monogram "logos" (`ZAR`/`ASO`), a previously-hardcoded "In stock" line, and a flat 50%-of-retail resale price are the most likely things a sharp investor flags; (2) decision-point friction — 3-4 retail rows above the primary Buy button dilute the one clear action; (3) match-precision overclaim — a 2-signal (tag/color) heuristic rendered as a confident colored % risks an "it said 84% but these don't go together" moment.

## Fixed now (this run, small/safe)
- **Removed the fake "In stock" inventory claim** on retail rows → honest **"Shop new"** (a true new-vs-resale fact), keeping every row two-line so Gabbana's resale-hierarchy fix still holds.
- **Marked the resale price as an estimate** → **"Resale est. $Y"** (was "Resale from $Y"), so the 50% formula reads as a guide, not a quote.

## Proposed to IDEAS.md (larger — design/backend)
- Real retailer logos (small static SVG set for the top 5-6) — highest-leverage trust fix; text monograms are the #1 panel flag.
- Live price / availability on store rows via the existing `/api/resolve-product` path instead of static scope labels.
- Data-driven resale price (category + brand-vibe, or a real Depop median) to replace the flat 50%.
- Test "Where it sells" collapsed behind the Buy button as an expandable "Other places to buy", so the primary action stays the unambiguous default.
- Soften match-number false precision (round to 5s, or pair sub-60% with "a fresh direction" framing).

## Caveat
Scores are a synthesized aggregate (directional, order-of-magnitude), not a measured 100-person study. The one hard data point underneath is the live code — which is exactly why the trust metric is lowest: it's the one place the sheet still shows synthetic data dressed as real.
