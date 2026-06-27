# User Survey — My Store "Insight" sheet (post-redesign)

**Date:** 2026-06-27
**Target:** My Store → Insight bottom-sheet (seller storefront analytics/advisor)
**Type:** Confirmation survey after a big visual change (Gabbana gate 9.5) — did the redesign actually improve the screen?
**Panel:** ~100 aggregate experts — clothing resellers (Poshmark/Depop/Vinted sellers' perspective) + marketplace/commerce product managers. Steered via the `ayalon` product subagent.
**Artifacts:** screenshot `/tmp/insight_dark.png`; chart `survey_insight.png`.

## What changed (context for the panel)
Before: the Insight sheet just re-showed the top stats strip — a Performance KPI grid, Audience views block, category bars, and top performers. A mirror of numbers the seller already saw; zero new decisions.
After: an actionable advisor — a **Store Health score (0-100)** + verdict + 3 distinct KPIs (Revenue/Conversion/Saves), a **"Do next"** stack of recommendation cards (refresh stale listings, complete incomplete listings, fix pricing outliers, list unworn closet items), a **Views→Saves→Sales conversion funnel** with a one-line diagnostic, and a **weekly sales goal**.

## Metrics (aggregate panel averages, 1-10)
| Metric | Score |
|---|---|
| Actionability | 8.4 |
| Clarity / not-overwhelming | 7.8 |
| Usefulness for running a store better | 8.1 |
| Visual quality / polish | 7.9 |
| **Overall satisfaction** | **8.0** |

Chart: `survey_insight.png`.

## Conclusions
- **The redesign worked — biggest single lift.** The old sheet mirrored the strip (no new decisions); the new "Do next" stack with specific counts, named items, and buyer-language rationale ("buyers filter by these", "older listings drop in search") is how real resellers think. The pricing callout ("Designer Blazer $220 vs ~$38") was the single most-praised element — concrete, item-level, comparison-anchored.
- **Funnel + diagnostic is the standout for "run my store better."** Views→Saves→Sales as a shrinking bar plus one plain-English read ("buyers save but don't buy — try a small price drop") ties the conversion number to a concrete action.
- **Honesty footer ("estimated until live sales tracking is connected") was noticed and appreciated** — pre-empts the "these numbers look made up" objection.
- **No metric scored below 4. No severe finding.**

### Fixed now
- (This survey *is* the fix — the entire redesign that prompted it.)

### Proposed to IDEAS.md
- **CTA consistency** — 2 of 4 cards have buttons (Refresh, List), 2 don't (incomplete, pricing). The button-less cards read as "noted but I can't act here." Make every card resolve to a tap ("Fix details" / "Edit price"), or none.
- **Score credibility** — the 40-point floor means even the worst store shows 40; experienced sellers sense the floor. Add a movement/projection signal ("Fix these → ~74") so the score feels earned, not decorative.
- **Priority legibility** — the accent stripes (warn/priority/suggest) read as decoration without a legend; consider a subtle "highest impact" tag on the top card.
