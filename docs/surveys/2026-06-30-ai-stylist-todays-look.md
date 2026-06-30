# User Survey — AI Stylist "Today's Look" daily hero

**Date:** 2026-06-30
**Target:** The new "Today's Look" daily contextual hero at the top of the AI Stylist screen (`#outfits` view, nav "AI").
**Type:** Post-change confirmation survey (big visual change, demo-critical screen, after Gabbana 9/10 PASS).
**Panel:** ~100 expert reviewers synthesized in aggregate — fashion-app PMs, stylists, target users. Steered via the `ayalon` product subagent (product panel) + `gabbana` design gate (visual panel).
**Charts:** `/tmp/survey1.png` (per-metric scores), `/tmp/survey2.png` (before/after the form→hero change).

## What was reviewed
A pinned card at the very top of the AI tab. On open, it greets the user with ONE ready-to-wear look:
- Live context eyebrow — real day-of-week + time-of-day + occasion (e.g. "Tuesday Late Night · Casual Day").
- Look-name headline + a hero photo built from the user's OWN closet + paired-item swatch.
- An items line + ONE quiet CTA ("See the full look →").
- Graceful empty state ("Scan your first item") when the closet is empty.
- Two secondary entries beneath: "Chat with Abigail" + "Style Swipe".

This replaced a screen that opened straight to a "type the occasion" Outfit Generator form (now demoted below the hero).

## Metrics (1-10, aggregate panel average)

| # | Metric | Score | Rationale |
|---|--------|-------|-----------|
| 1 | First-impression / wow | **7.6** | Opening to a finished look beats an empty form; wow capped because the hero is one closet item + swatch, not a full-body composite. |
| 2 | Daily-return motivation | **6.4** | Real day+time context is a genuine reopen reason, but the look only changes when the occasion bucket flips (6 buckets) → similar days can look identical. |
| 3 | Clarity | **8.3** | Eyebrow → name → items → one quiet CTA is an unambiguous read; single CTA removes choice paralysis. |
| 4 | Trust in recommendation | **7.1** | "From your own closet" is highly credible when the closet is full; drops when the builder back-fills placeholder items the user doesn't own. |
| 5 | Purchase / engagement intent | **6.0** | CTA drives a tap, but routes back into the generator rather than a wear/shop/save action — intent leaks at the destination, not the copy. |
| 6 | Premium-quota acceptance | **5.7** | "3 free/day then upgrade" reads fair, but gating the daily habit hook is risky — and the quota is a PROPOSAL, not shipped (concept-test only). |

**Panel composite: 6.9 / 10. No SEVERE (no metric < 4).**

Design panel (Gabbana): **9/10 PASS** at the 8.5 bar — hierarchy hero-dominant, light-theme tokens clean, 8pt rhythm, touch targets ≥44px.

## Conclusions
- The structural bet is right: replacing a "type the occasion" form with a ready-made hero is the biggest perceived-value jump — clarity (8.3) and first-impression (7.6) carry the screen.
- The trust mechanic is fragile at the edges: a full closet feels like magic; a sparse closet silently inserts items the user doesn't own. For brand-new users (most likely to have a thin closet) this undermines the "your own closet" promise on day one. (Note: the investor-demo closet is seeded with 13 items, so this does not affect the demo — it's a real-user fast-follow.)
- Daily-return is the weakest real metric (6.4): the engine has only 6 occasion buckets, so the look repeats across similar days. The promise of daily freshness outruns the variety the engine delivers.
- The CTA destination, not the copy, is the engagement leak — it re-opens the generator instead of landing on a wear/save/shop moment.
- The premium model is scored as a concept (no gate code exists), not a shipped result.

## Fixed now
- None this run — the screen passed both gates (Gabbana 9, product composite 6.9, no SEVERE) and the demo closet is seeded, so the trust-fragility edge does not affect the demo. Fast-follows logged to IDEAS to keep run scope to one task.

## Proposed to IDEAS
- **#40** Suppress placeholder back-fill in the hero when the closet is too thin (show the add-items prompt instead of a half-real look) — protects the trust metric for new users.
- **#41** Re-point the CTA to a real wear/save/log destination instead of re-opening the generator form — recover engagement intent.
- **#42** Add a 2-line "why this look" rationale ("evening + weekday → Date Night") — cheap trust lift; the engine already computes it.
- **#43** Expand daily variety (rotate within an occasion bucket, weight by least-worn, factor weather) so daily ≠ identical — targets the weak daily-return score.
- **#44** Composited full-body hero image instead of one product photo + swatch — closes the wow ceiling (needs design + asset pipeline).
- Premium quota: validate before building — do NOT gate the daily hero (the habit hook); gate additional on-demand generations from the demoted form. Test 3/day vs unlimited-hero before committing (relates to IDEAS #35).
