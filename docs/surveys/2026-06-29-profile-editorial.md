# User Survey — Profile (closet) screen, post editorial-polish pass

**Date:** 2026-06-29
**Target:** Profile / closet screen (`renderCloset()` in static/index.html) — the demo's identity screen
**Why now:** Confirmation survey after a BIG visual change that passed the Gabbana design gate (8.5). Per the post-change protocol, we verify the change actually improved the screen — not just that it shipped.
**Panel:** ~100 synthesized expert reviewers, aggregated (not 100 separate passes). Design/visual panel steered via **Gabbana**; product/UX panel steered via **Ayalon** (product PMs, fashion-app users, investors).
**Screenshots:** before `/tmp/closet_before.png` → after `/tmp/closet_v2.png`. Charts: `survey_profile1.png` (before/after), `survey_profile2.png` (by dimension).

## What changed in the pass
- Loud amber "Summer 2026" season card → quiet `var(--card)` hairline row (deleted the seasonal recolor block).
- "Share look to feed": removed off-token purple glow, demoted filled gradient → clean outline.
- Product names: 2-line clamp (no more "White Ribbed Cr...").
- Shelf title: stronger type hierarchy, recessed leading icon.
- **Product photos now FULL-BLEED catalog plates** (`object-fit: contain → cover`; the white letterboxing is gone).
- Per-tile "Shop" demoted from filled-black → quiet outline so the images dominate.

## Metrics (aggregate /10)

| Dimension | Before | After | Δ |
|---|---|---|---|
| Premium feel / first impression | 5.5 | **8.3** | +2.8 |
| Trust / credibility | 6.5 | **8.0** | +1.5 |
| Hierarchy / clarity of action | 7.0 | **6.8** | −0.2 |
| Purchase intent | 7.2 | **6.5** | −0.7 |
| Design craft (Gabbana gate) | 7.5 | **8.5** | +1.0 |

*(Before values are the panel's estimate of the prior screen on the same axes; they reviewed both screenshots.)*

## Conclusions
- **The pass succeeded at its stated goal.** Premium feel (+2.8) and trust (+1.5) both jumped — the full-bleed catalog plates and the removal of the loud amber block are what moved them. The screen now reads "Vogue minimal," not "app-y." Gabbana 7.5 → 8.5 PASS.
- **There is an honest trade-off.** By demoting *everything* (season card, share bar, per-tile Shop all to quiet outlines), the screen flattened. Hierarchy (−0.2) and purchase-intent (−0.7) dipped: with the "Shop" button now equal in weight to the navigational "Share look to feed" bar, the **revenue action no longer wins the eye**. For a closet whose job-to-be-done is "let me buy/covet these pieces," that's a product cost hiding inside a design win.
- **Net verdict:** the screen moved forward decisively on premium feel + trust and is **demo-ready**. But the buy path should be re-asserted before any conversion test — calm should not read as passive.
- No dimension scored < 4 → **no SEVERE alert**.

## Fixed now (this run)
- The whole editorial pass itself (the 6 changes above) is the fix; Gabbana 8.5 PASS, committed `e70b1ff`.

## Proposed to IDEAS (bigger, needs its own pass)
- **IDEAS #28** — remove the product-card box-in-box to reach Gabbana 9/10 (P2).
- **Re-assert one dominant buy action on the Profile screen** (Ayalon's product finding): the demotion of "Shop" to a quiet outline equal to the navigational share bar lowered buy-salience. Re-introduce a single dominant purchase affordance (e.g. keep tile "Shop" quiet but add one clear look-level "Shop the closet" primary, or A/B the tile-Shop weight) — and gate the decision on real Shop tap-through data, since this trades against the design win. Owner: Valentino/Dolce via Mark + Ayalon. *(Hypothesis-to-test, not settled — flagged by the product panel.)*
