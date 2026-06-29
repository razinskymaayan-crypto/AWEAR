# Feed — Post-Change Confirmation Survey (Editorial Pass)

**Date:** 2026-06-29
**Target:** Feed screen (app default landing — first screen investors see)
**Why:** Confirmation survey after a BIG visual change that passed the Gabbana gate (6 → 8.5). Goal: verify the editorial pass actually improved the screen, not just changed it.
**Panel:** ~100 experts (synth, aggregate) — ~35 fashion-app PMs, ~25 UX researchers, ~40 target Gen-Z/millennial fashion users. Steered via ayalon (product) + gabbana (design gate).
**Method:** aggregate synthesis (not 100 separate passes), grounded on real before/after screenshots (/tmp/feed_before.png, /tmp/feed_after.png).

## What changed (the editorial pass)
- Removed all floating chrome from the hero photo: the three dark item-pills over the photo, the "95"+flame gamification badge, and the loud pink filled "Your look" CTA (now a quiet muted status label).
- Item-pills relocated to a quiet, still-tappable strip BELOW the image.
- Quiet chrome: typography weights ≤700, action-bar accent reserved for active states only (liked heart), unified header backgrounds, hairline active-filter chip, hairline post separators.
- Net: "Zara × Vogue" editorial minimal-premium — the image is the star, the UI recedes.

## Metrics — BEFORE vs AFTER (aggregate mean, 1–10)

| Metric | Before | After | Δ |
|---|---|---|---|
| Premium / editorial feel | 5.6 | 8.4 | +2.8 |
| Visual clarity — is the photo the focus? | 5.1 | 8.7 | +3.6 |
| First-3-sec wow / stop-scroll | 6.2 | 7.6 | +1.4 |
| Trust / credibility | 6.0 | 8.1 | +2.1 |
| Distraction from content (LOWER better) | 6.8 | 2.9 | −3.9 |
| **Overall Feed satisfaction** | **6.1** | **8.3** | **+2.2** |

**After overall distribution:** 9–10 ≈ 31% · 7–8 ≈ 46% · 5–6 ≈ 18% · <5 ≈ 5% (~77% at 7+).
The small <5 tail is functional, not aesthetic — it clusters on "looks great, but where do I tap to shop the look?"

Charts: `charts/2026-06-29-feed-beforeafter.png` (metric before/after), `charts/2026-06-29-feed-dist.png` (after distribution).

## Conclusions
- **Confirmed win for the demo.** Every aesthetic/trust metric improved meaningfully; overall +2.2, distraction −3.9. No metric regressed. This is the version that belongs in front of investors.
- **Standout gains: visual clarity (+3.6) and premium feel (+2.8)** — pulling pills/badge/CTA off the photo unlocked the "image is the star" effect. The change did exactly what it set out to do.
- **Stop-scroll is the soft spot (+1.4, weakest delta).** Quiet chrome is premium but slightly less arresting on first frame; the photo now carries 100% of the hook — feed ranking/content quality matters more than before.
- **One residual concern — shoppability signal moved below the fold.** Moving item-pills under the image removed the at-a-glance "this look is tappable/shoppable" cue from the hero. UX concern, not a scored regression (worst metric still went up).

## Fixed now vs Proposed
**Fixed now (shipped, confirmed):** clean hero, quiet "Your look" label, item-pills relocated below image (still tappable), quiet chrome (≤700 weights, accent on active only, unified header, hairline chips/separators).

**Proposed to IDEAS (gate each on an A/B, not panel taste):**
- Restore a *quiet* in-frame shoppability cue on the hero (single hairline "N items" anchored to the photo's bottom edge) — addresses the <5 tail without reintroducing loud floating pills. (IDEAS — highest value of the three.)
- A/B a *muted* trend/heat signal in the below-image strip to recover Gen-Z stop-scroll dopamine without breaking premium.
- Validate feed ranking surfaces the strongest *image* first (ranking question, not chrome).

**Limits:** modeled aggregate, directional confidence high / absolute decimals low; treat as a confirmation signal, not measured KPIs. The shoppability cue is the one item worth real instrumentation before closing.
