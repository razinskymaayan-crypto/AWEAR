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
6. **Theme + accent pass** — swap Style Identity / Wrapped gradients from `--accent3` purple to warm `--accent`/`--accent2`; promote one signature metric (Rewear ring or cost/wear) for stronger hierarchy.
