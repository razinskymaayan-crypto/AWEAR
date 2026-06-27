# User Survey — Closet Statistics / Analytics screen

**Date:** 2026-06-27
**Target:** The Analytics view (`renderAnalytics`, `static/index.html:4812`) — AWEAR's "closet statistics": Closet Health Score, hero stats, Style Identity, Cost-Per-Wear (Wear Champion / Hidden Cost), Wardrobe Health bars, Dead Zone alert, Sustainability/Rewear score, category bars, Season Recap entry.
**Screenshots:** `/tmp/analytics.png` (before) → `/tmp/analytics_after2.png` (after fix).
**Requested by:** founder (INBOX).
**Charts:** `survey1` (panel scores as found), `survey2` (metric credibility before/after), `survey3` (panel metrics before/after this run).

## Panel
~100 synthesized expert reviewers across three lenses, steered by domain subagents:
- **Design / visual** (Gabbana) — benchmarked vs Instagram Insights / Pinterest Analytics / Spotify Wrapped / Zara.
- **Product** (Ayalon) — fashion-tech PMs, sustainability + resale power users, investors; judged against the <5-min investor-demo "wow" bar.
- **Commerce / intelligence** (Valentino) — Depop / Vinted / Poshmark power-sellers, circular-fashion analysts.

## Metrics (1–10, aggregate — as found)
| Metric | Score | Lens |
|---|---|---|
| **Trust / credibility** | **3.0** | Product |
| Brand consistency | 4.0 | Design |
| Commerce intent | 4.0 | Commerce |
| Actionability | 4.0 | Product |
| Data credibility | 4.0 | Commerce |
| Design satisfaction | 5.0 | Design |
| Wow for investors | 5.0 | Product/Design |
| Visual hierarchy | 6.0 | Design |
| Product value | 6.0 | Product |

## Headline finding (SEVERE — Trust 3/10, all three panels independently)
**The demo closet was "too perfect."** All 13 seed items had `wear_count ≥ 2`, which mathematically forced:
- **100% utilization · 92% active · 100% rewear → Closet Health Score 98/100, Grade A "thriving."**
- **No genuinely never-worn item**, so the Dead Zone fell back to "barely worn" copy — the resale funnel fired on items the user actively wears.

Why this is the single biggest demo risk:
1. **Destroys trust.** A careful investor knows real closets have dead weight. A flawless score on the first screen reads as canned data, not a tool that *found* anything — the product's whole promise is exposing waste.
2. **Kills the growth narrative.** 98/100 with everything maxed leaves no headroom — there's no "watch your score climb" arc to demo over three weeks.
3. **Starves the resale loop.** 100% utilization means "nothing to sell" — the exact closet a founder demos zeroes out the monetization pitch.

Two more cross-panel issues:
- **Off-brand identity card** — the Style Identity card (the aspirational, shareable hero) rendered cold gray/silver (built on `--accent3` purple, which flattens to gray in the active light theme) on an otherwise warm terracotta/camel screen.
- **Archetype contradiction** — "The Quiet Minimalist" sat directly above `streetwear` + `y2k` pills, reading as the system not understanding the user.

## Fixed now (this run — Valentino, Gabbana-gated 8/10)
1. **Realistic demo closet** — set 3 occasion/impulse items to `wear_count:0` (Cargo Pants $90, Pointed-Toe Mules $60, Camel Blazer $150 = a real ~$300 never-worn Dead Zone). Result: utilization **77%**, Health **75/Grade B** "Good habits — keep it up. Wear more items and sell unloved pieces to raise your score." Credible, with headroom and real fuel for the resale loop. Item count / prices / images unchanged.
2. **Hidden Cost = worn-but-underused only** — restricted the Hidden Cost pick to items with `wear_count ≥ 1`, so it stays the praised *"Slip Satin Midi Dress · $145 · 2 wears · $73/wear"* and never duplicates the never-worn Dead Zone.
3. **Warm Style Identity card** — re-skinned off `--accent3` purple to a terracotta→camel gradient driven by `var(--hl)` (stays warm in light mode too), with legible light text + translucent pills. Now the warmest, most premium card on the screen instead of the coldest.
4. **Archetype reframed as range** — kept the bold "The Quiet Minimalist" hook, added a conditional honest descriptor *"Minimal core, with streetwear + y2k range"* so mixed tags read as range, not contradiction (only shows when secondary tags exist).
5. **Pill contrast** — strengthened `.an-identity-pill` fill/border + text-shadow so chips pass AA across the full gradient (the camel end previously sat ~2.6:1).

Verified: `npm run check-render` ✓, re-screenshot confirms 75/B, 77% utilization, warm legible card, no on-screen contradictions. Gabbana gate **8/10 — ships**.

## Conclusions (bullets)
- **Strong analytics bones, undermined by seed data.** The Closet Health Score, dollar-quantified Hidden Cost, the dead-zone→sell loop, and Style Identity in one screen are genuinely best-in-class for emotional + commerce framing.
- **Credibility was the #1 risk and is now fixed** — a B-grade closet with a real Dead Zone and a real Hidden Cost is far more trustworthy *and* more actionable than an all-green 98.
- **The warm re-skin pulled the screen into the AWEAR brand world** — the cold purple/gray card had read as a borrowed productivity-app component.
- **Commerce intent still leaks at the Hidden Cost card** — it names the money ($73/wear) but offers no "List it" action. (Proposed — highest-ROI next step.)
- **Most insights are still read-only dead ends** — "Wear one this week" is a toast, not a tracked challenge; Style Identity / Wear Champion / Rewear / category bars don't lead anywhere. (Proposed.)
- **Naming whiplash** — header reads "awear wrapped", H1 reads "Analytics", a card sells "Season Recap" — three names for one surface. (Proposed.)

## Proposed to IDEAS (bigger, awaiting prioritization)
1. **Wire a "List for ~$X" CTA onto the Hidden Cost card** → straight into the prefilled sell sheet. Highest-ROI commerce fix; it currently leaks 100% of the screen's strongest sell intent.
2. **Make insights tappable / drilldown** — Dead Zone & Hidden Cost expand to the actual items with thumbnails + one-tap Wear/List; "Wear one this week" becomes a tracked weekly challenge.
3. **Add product thumbnails to the Cost-Per-Wear cards** — the $2/wear vs $73/wear "aha" is text-only today; photo-first is core AWEAR.
4. **Resolve the one-screen naming** — pick "Wrapped" vs "Analytics" vs "Season Recap" and commit (recommend the Wrapped narrative — it's the actual wow).
5. **Differentiate the two scoring rings** — Closet Health Score ring and Sustainability Rewear ring use the same "/100 in a circle" device; demote one and add one-line metric definitions so numbers feel earned.
6. **Score-progress over time** — now that the score starts mid-range, show a month-over-month trend arrow so the "climb" is visible (the retention hook).
