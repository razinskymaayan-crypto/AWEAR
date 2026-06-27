# IDEAS — proposals awaiting prioritization

Bigger findings from surveys/research that are too large to ship in the same run.
Founder/Ayalon prioritizes; small obvious wins are fixed directly, not parked here.

---

## Closet Analytics screen (from 2026-06-27 survey — docs/surveys/2026-06-27-closet-analytics.md)
1. **Wire "List in My Store" to carry dead-zone item IDs** into the sell flow (`prefillListing(ids)`) and show forward payout ("List 3 · earn ~$190") next to the sunk-cost "$340 sitting there". Highest-leverage commerce conversion fix — the screen creates resale intent then leaks it at a blank sell tab.
2. **Make insights tappable / drilldown** — Dead Zone + Hidden Cost cards expand to the actual items (thumbnails) with one-tap Wear / List, instead of a toast.
3. **"What should I wear today?" card** at the top of Analytics — turn a backward-looking report into a daily reason to open the app (rules-based v1: temperature + wear-recency + occasion, no ML).
4. **Single composite "Closet Health Score" + month-over-month trend arrow** — one number investors remember that goes up. (Data layer now consistent as of 2026-06-27 fix, so safe to build on.)
5. ~~**Honest sustainability score** — base the Rewear score on real rewear frequency, not `utilization × 1.05` re-captioned (panel called it vanity math).~~ **SHIPPED 2026-06-27 (valentino):** Rewear Score now = real share of wardrobe worn 2+ times (`rewornItems = wardrobe.filter(wear_count >= 2)`), so the on-screen caption "You rewear X% of your wardrobe" is literally true. Seed 30 (≤ utilization seed) only when no wear data. Gabbana 9/10. A CO₂-based v2 (kg kept in circulation) is still open if we want a richer metric later.
6. ~~**Theme + accent pass** — swap Style Identity / Wrapped gradients from `--accent3` purple to warm `--accent`/`--accent2`.~~ **SHIPPED 2026-06-27 (valentino):** `.an-identity-card` re-skinned to a terracotta→camel gradient driven by `var(--hl)` (stays warm in light mode), legible light text + AA-passing translucent pills. Gabbana 8/10. *Still open:* promote one signature metric (Rewear ring or cost/wear) for stronger hierarchy — see #5 below.

## Closet Statistics screen (from 2026-06-27 survey — docs/surveys/2026-06-27-closet-statistics.md)
> Survey re-ran on the current screen. Root finding (SEVERE, Trust 3/10): the demo closet was "too perfect" (all items worn → 98/A, 100% utilization, no dead stock). **Fixed this run:** reseeded 3 never-worn items → 75/B credible closet with a real ~$300 Dead Zone; Hidden Cost restricted to worn items; warm identity card; archetype reframed as range. Remaining proposals:
1. **"List for ~$X" CTA on the Hidden Cost card** — it names the money ($73/wear) then dead-ends. Wire it straight into the prefilled sell sheet (resale est ≈ price×0.5). Highest-ROI commerce fix; distinct from the already-shipped Dead Zone List flow.
2. **Product thumbnails on the Cost-Per-Wear cards** — the $2/wear vs $73/wear "aha" is text-only today; the seed carries `image_url`, so add a small thumbnail (photo-first is core AWEAR).
3. **Make insights tappable** — "Wear one this week" is a toast, not a tracked weekly challenge; Style Identity / Wear Champion / Rewear / category bars are terminal cards.
4. **Resolve one-screen naming** — header "awear wrapped" vs H1 "Analytics" vs a "Season Recap" card = three names for one surface. Pick one (recommend the Wrapped narrative).
5. **Differentiate the two scoring rings** — Closet Health Score ring and Sustainability Rewear ring use the same "/100 in a circle" device; demote one and add one-line metric definitions so the numbers feel earned.
6. **Score-progress trend arrow** — now that the score starts mid-range (75/B), a month-over-month arrow makes the "climb" visible (retention hook). (Builds on the shipped composite Closet Health Score, commit e0cdf12.)
