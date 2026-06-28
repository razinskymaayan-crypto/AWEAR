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

## Closet Analytics — 2026-06-27 survey round 3 (100-expert panel, doc: 2026-06-27-closet-analytics.md)
*Shipped this run (no longer ideas): true conic progress-arc rings; actionable weakest-lever Health hint; utilization/rewear disambiguation; Hidden Cost → pre-filled sell form + "Recover ~$X" CTA.*
Remaining bigger bets, ranked by survey impact:
1. **Closet-health trend / delta** ("75, +7 this month") — the #1 retention lever; converts a one-time reveal into a weekly ritual. Needs a `closet_health_history` snapshot table + a weekly write job (backend → Sam).
2. **Collapse the two competing "/100" rings** — make Closet Health the single hero; render rewear/active/utilization as labelled *contributors* beneath it, not a second equal ring (kills the "my score dropped to 30?" confusion). Layout decision → Mark/Dolce.
3. **CPW projection on Hidden Cost** — "wear 3 more times → $36/wear" with a tiny progress bar; reframes guilt as a winnable goal (highest motivational-pull-per-pixel per the product panel).
4. **Credible resale estimates** — replace the flat 50%-of-retail multiplier (repeated in 3+ places) with condition/brand-aware **ranges** ("~$60–90, est."); label demo fallbacks "sample" until real data exists. Biggest trust risk on the screen. Needs a resale-estimate helper/endpoint.
5. **Make Smart Declutter results listable** — the AI recommends selling each item then offers only "Close"; add a per-row "List" button reusing `openSellForm()`.
6. **Persistent above-the-fold "Turn dead stock into ~$X" CTA** + a real community-average rewear benchmark endpoint (today hardcoded 52%).

## Store Insight follow-ups (from 2026-06-27 confirmation survey — docs/surveys/2026-06-27-store-insight.md, overall 8.0/10)
7. **CTA consistency on Insight cards** — 2 of 4 "Do next" cards have action buttons (Refresh, List), 2 don't (incomplete-listings, pricing-outliers). Button-less cards read as "noted but I can't act here." Wire an edit flow so every card resolves to a tap ("Fix details" / "Edit price"), or remove all CTAs for consistency.
8. **Credible Health score** — the 40-point floor (`Math.max(40, ...)`) means even the worst store shows 40; experienced sellers sense the floor. Add a projection/delta ("Fix these → ~74" or vs-last-week) so the score feels earned, not decorative.
9. **Priority legibility on Insight** — the warn/priority/suggest accent stripes read as decoration without a legend; add a subtle "highest impact" tag on the top card so the colour coding signals order.

## Feed social-proof follow-ups (from 2026-06-27 confirmation survey — docs/surveys/2026-06-27-feed-social-proof.md, overall 8.3/10)
10. **Comment persistence (BE-005)** — `_comments_store` in app.py (~line 1451) is an in-memory dict; a user-posted comment vanishes on server restart. Migrate to SQLite via `_init_db` (Sam/Oren). Demo risk only if a live viewer posts then refreshes; seeded comments persist client-side regardless.
11. **Reaction realism jitter** — reaction totals are a fixed ~10% of likes with a fixed ❤️🔥⭐✨ split; under expert scrutiny this can read as "seeded". Add small per-post jitter so no two posts share the same ratio.
12. **Comment timestamps** — add relative time ("2h ago") to comments to reinforce recency / "alive" feel (survey flagged its absence as the main thing undercutting authenticity).

## Home "Today's Look" carousel polish (from 2026-06-28 post-fix survey — docs/surveys/2026-06-28-home-todays-look.md, overall 8/10, no severe)
13. **Hero crop/lighting consistency** — cards mix full-body vs portrait framing and golden-hour-warm vs cool-daylight grades; the two-up split seam is visible. Align hero framing (waist-up) + a unified warm-neutral grade for a true editorial rail (Gabbana P1 #1/#2 — highest visual ROI before the demo). Dolce + Netta.
14. **Card copy truncation** — title/desc cut mid-word ("White Ribbed Crop T…", "Off-duty energy with just the right amoun…"); fit the copy or use a clean ellipsis with more line-height so cards don't read as unfinished.
15. **Repeated denim bottom** — Weekend Vibes and Street Style cards both show the same light-wash denim; vary the bottom/crop so the looks read as genuinely distinct.
16. **"Wore it" button glow** — the heavy pink glow competes with the hero carousel above it; dial it back so the imagery stays the star.
17. **Demo-image durability** — consider light compression/`<picture>` for the bundled `static/img/closet/*.jpg` (currently ~1.4MB total) and extend the local-bundle pattern to any other seed that still hotlinks live CDNs (feed posts, marketplace), to fully eliminate CDN-rot from the demo.

## Light-mode contrast audit (surfaced during 2026-06-28 Profile-header fix)
18. **Systemic near-white text in light mode** — fixing the invisible Profile bio revealed the same root cause is scattered across the file: ~9 elements use hardcoded `rgba(246,246,249,.5–.85)` (near-white) for text — `.stylist p`, `.combo-nm`, `.sr-hero-label`, `.adm-kpi-sub`, `.adm-grade-sub`, `.rw-pts-label`, `.rw-level-next` and more. These are invisible or very low-contrast on the light-mode cream background. Do a one-pass DS-004 sweep replacing each with the correct token (`var(--muted)` / `var(--fg)` at opacity) so every screen is legible in light mode. Owner: Netta (design system) + Dolce. Medium effort, high demo-safety value (light mode is the device default for many testers).
19. **Bio/name AA contrast at token level** — Gabbana flagged `--muted` light (#8A857E on #FAF9F7 ≈ 3.0:1) is borderline for WCAG AA on small text. Consider darkening `--muted` slightly OR using `--fg` at reduced opacity for secondary text. Token-level decision — affects all muted text globally. Owner: Netta.
