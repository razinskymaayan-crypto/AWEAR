# User Survey — Closet Analytics ("awear wrapped")

**Date:** 2026-06-27
**Target:** The Analytics / "awear wrapped" screen (`renderAnalytics`, `static/index.html` ~4854–5125) — Closet Health Score, hero stats, Style Identity, Wear Champion / Hidden Cost, Wardrobe Health bars, Dead Zone, Sustainability, category bars, Smart Declutter, Season recap.
**Trigger:** INBOX task — "סקר משתמשים על הסטטיסטיקה של הארון … פאנל מומחים, גרפים ונקודות סיכום, ותקנו מה שצריך."
**Screenshots:** `/tmp/analytics.png` (before) → `/tmp/analytics_after.png` (after this run's fixes).

## Panel (n ≈ 100, synthesized in aggregate)
| Panel | Composition | Steered via |
|-------|-------------|-------------|
| Design | ~40 expert visual/product designers (vs Instagram Insights / Spotify Wrapped / Zara) | gabbana |
| Product | ~30 PMs + ~10 target users (women 22–35) | ayalon |
| Commerce | ~20 resale / fashion-intelligence experts (Depop/Vinted/Poshmark) | valentino |

## Metrics

### Aggregate score by panel — *chart: survey1.png*
| Panel | Score /10 |
|-------|-----------|
| Design | 6.4 |
| Product | 6.4 |
| Commerce | 6.5 |
**Overall ≈ 6.4 / 10** — a strong, above-average analytics screen; not yet at the Spotify-Wrapped / Zara bar. No dimension scored < 4 (no severe finding).

### Product sub-scores — *chart: survey2.png*
Actionability 7.0 · Metric clarity 5.5 · Motivation 6.8 · Trust in numbers 5.0 · "Open weekly" 5.2.

### Design & Commerce sub-scores — *chart: survey3.png*
Design: hierarchy 5 · density 6 · scannability 6 · emotion 7 · world-class consistency 5.
Commerce: resale-loop 6 · money-figure credibility 4 · CPW framing 8 · declutter flow 5.

## Bullet conclusions
- **The spine works.** Cost-per-wear (Wear Champion vs Hidden Cost) and the Dead Zone → "sell and earn ~$X" loop are the screen's strongest, most on-brand elements. Copy voice is warm and specific — protect it.
- **#1 confusion — two unrelated "/100" scores.** Health Score 75 (top) and Rewear 30 (mid) both render as `/100` rings; users read the 30 as a contradiction. Plus utilization (worn ≥1) vs rewear (worn ≥2) were indistinguishable.
- **#2 — the Health Score read as a vanity metric.** A composite of three inputs *also shown below it*, with a generic hint and no path to a higher grade — "judgment without a path."
- **#3 — credibility risk.** Seeded fallbacks ($11.40, $340, 50%-of-retail, "60+ days") read as fabricated and poison trust in the real numbers. The flat 50%-of-retail resale multiplier is the single biggest trust risk.
- **#4 — commerce loop dead-ended.** The two strongest reasons to sell (the Hidden Cost card and the Declutter results) were inert — no way to act on them.
- **#5 — it's a one-time reveal, not a weekly ritual.** No trend/delta, so no reason to return after the first "wow."

## Fixed now (shipped this run)
All in `renderAnalytics` + CSS, gated by Gabbana at **8.5/10**, render-verified:
1. **DS-004** — `.an-sec-title` font-size gained a `13px` fallback.
2. **True progress-arc rings** — Health & Rewear rings are now conic-gradient arcs that fill to the actual % (was a solid full-colour border implying 100%). Biggest perceived-quality jump.
3. **Disambiguated the ratios** — "Utilization · worn 1+×" and "You re-wear X% of items 2+ times — your true favorites."
4. **Actionable Health hint** — names the weakest weighted lever, e.g. *"Wear 3 never-worn items to climb toward Grade A."* (was generic boilerplate).
5. **Hidden Cost → sell** — the card is now tappable (real items only), opens the pre-filled sell form, with a green "Recover ~$X — tap to list" micro-CTA + `:active` tap feedback. Closes the strongest insight→listing gap.

## Proposed to IDEAS (bigger, needs design/backend)
- Trend/delta on Health Score & metrics ("75, +7 this month") → converts reveal into weekly ritual. Needs a `closet_health_history` snapshot table + weekly job.
- Demote the second ring; show rewear/active/utilization as *contributors* under one Health hero instead of three competing rings.
- CPW projection on Hidden Cost ("wear 3 more times → $36/wear") — reframe guilt as a winnable goal.
- Credible, condition/brand-aware resale **ranges** ("~$60–90, est.") to replace the flat 50%-of-retail multiplier; label fallbacks "sample" until real data exists.
- Make Smart Declutter results listable (per-row "List" button) — today it recommends selling then offers no sell button.
- Persistent above-the-fold "Turn dead stock into ~$X" CTA; real community-average benchmark endpoint.
