# Item-Detail Bottom Sheet — Post-Change Confirmation Survey (Editorial Pass)

**Date:** 2026-06-29
**Target:** The item-detail bottom sheet that opens when a user taps any feed look. Top→bottom: big product photo + category pill → match-band (the "98% match to your closet" number + closet chips) → item name + price → "Stylist picks" combos (item × user's own closet) → "Where it sells" (From $X + ZARA/ASOS/Mango/Depop store rows) → "Buy at ZARA $140" CTA.
**Why:** Confirmation survey after an editorial polish pass that passed the Gabbana gate (6 → 8.5 PASS). Goal: verify the change measurably *improved* the screen — and honestly flag if "quieter" cost us shoppability/purchase intent. Consistency check against the just-shipped Feed & Profile editorial passes.
**Panel:** ~100 synthesized expert reviewers (aggregate, not 100 separate passes) — ~35 fashion-commerce PMs, ~25 conversion/UX specialists, ~25 target Gen-Z/millennial shoppers, ~15 resale-marketplace/merch operators. Steered via ayalon (product) + gabbana (design gate).
**Method:** aggregate synthesis grounded on the editorial diff below. Baseline = the same sheet measured 2026-06-28 (`2026-06-28-wow-item-sheet.md`), pre-polish, before any weight/glow/token fixes.

## What changed (the editorial pass: 6/10 → 8.5/10)
- Removed the loud pink-glow halo around the Buy CTA.
- Removed the rainbow gradient-clipped price → solid, confident price.
- Capped all font-weights at 700 (was 900).
- Moved off-token grey surfaces onto the design system.
- Softened a heavy hero drop-shadow.
- Fixed a light-mode color bug.
- Net: quieter, Zara×Vogue editorial, consistent with the just-shipped Feed & Profile.

## Metrics — BEFORE vs AFTER (aggregate mean, 1–10)

| Metric | Before | After | Δ | Note |
|---|---|---|---|---|
| Premium / editorial feel | 5.4 | 8.6 | +3.2 | Killing weight-900 + rainbow price + glow is the whole game here |
| Visual hierarchy (eye lands photo→match→price→buy) | 5.8 | 8.3 | +2.5 | Solid price + softer hero shadow let the photo lead and the CTA terminate cleanly |
| Purchase intent (drives tap-to-buy) | 7.0 | 7.2 | +0.2 | Net flat-positive: lost glow "shout", gained credibility. See drop-off note. |
| Trust / credibility | 6.3 | 7.8 | +1.5 | Confident solid price + on-token surfaces + light-mode fix read as "real product, not a mockup" |
| WOW — the match-band moment ("98% match") | 8.1 | 8.4 | +0.3 | Already the hook; quieter chrome lets the *number* be the loud thing, not the UI |
| **Overall** | **6.5** | **8.06** | **+1.6** | |

After overall = mean(8.6, 8.3, 7.2, 7.8, 8.4) = **8.06**.
No metric averages <4 — no SEVERE flag.

**After overall distribution (modeled):** 9–10 ≈ 28% · 7–8 ≈ 50% · 5–6 ≈ 17% · <5 ≈ 5% (~78% at 7+). The <5 tail is not aesthetic — it clusters on shoppability friction (see below), the same tail the Feed pass showed.

Charts:
- `chart1` = metric bars (after scores): `charts/2026-06-29-item-detail-bars.png`
- `chart2` = before/after grouped: `charts/2026-06-29-item-detail-beforeafter.png`

## Conclusions
- **Confirmed win, and consistent with Feed/Profile.** Overall +1.6 (6.5→8.06); the two metrics the pass directly targeted — premium feel (+3.2) and visual hierarchy (+2.5) — moved most. Nothing regressed below baseline. This is the version that belongs in the demo, and it now matches the editorial register of the Feed and Profile screens (a real value: investors see one coherent product, not three).
- **The match-band survived the diet — that mattered most.** The biggest risk of "quieter" was muting the WOW. It didn't: pulling the glow/rainbow/weight-900 noise *off the chrome* let the 98% number become the loudest object on the screen by contrast. WOW edged up (+0.3) rather than down. The hook is intact.
- **Purchase intent is the honest soft spot (+0.2, basically flat).** Removing the pink-glow halo and the gradient price stripped two literal "BUY ME" attention magnets. The panel splits: conversion specialists note the CTA is now *credible but quiet* and a hair less arresting at the moment of decision; PMs counter that the trust gain (+1.5) and a price you actually believe convert better downstream than a price that looked like a sticker. Net read: **the quieter pass did not hurt intent, but it didn't help it either — and a quiet primary CTA is the one place to watch.** This is a watch-item, not a regression.
- **Drop-off / confusion points (unchanged by this pass — they're structural, not chrome):**
  1. **Decision friction before the CTA** — "Where it sells" puts 3–4 retail rows *above* the one primary Buy button, diluting the single clear action. The editorial pass made the CTA quieter, which very slightly sharpens this: the loudest thing near the decision is now the store list, not the button.
  2. **Two prices, one screen** — the solid item price up top and "From $X" / "Buy at ZARA $140" lower down can read as conflicting anchors. Now that the price is solid/confident (good), the *mismatch* between the headline price and the CTA price is more noticeable, not less.
  3. **Synthetic-data tells in store rows** (text-monogram logos, flat resale math) — pre-existing from the 6/28 survey, untouched here. Still the #1 trust drag a sharp investor flags.
- **Did "quieter" hurt shoppability? Honest answer: marginally at the CTA, net no.** The glow was doing real attention work; removing it is the right *aesthetic* call and the right *trust* call, but it's the one change with a plausible conversion cost. The fix is not to bring the glow back — it's to make the quiet CTA win on hierarchy (sticky/anchored, unambiguous default), which belongs in an A/B, not in panel taste.

## Fixed now (this pass — shipped, confirmed)
- Removed pink-glow halo around Buy CTA.
- Removed rainbow gradient-clipped price → solid confident price.
- Font-weights capped at 700 (was 900).
- Off-token grey surfaces moved onto the design system.
- Softened heavy hero drop-shadow.
- Light-mode color bug fixed.

## Proposed to IDEAS (gate each on an A/B, not panel taste)
- **Make the quiet CTA win on hierarchy, not loudness:** sticky/anchored Buy button so the primary action is the unambiguous default at the decision moment — recovers the attention the glow gave, without reintroducing the glow. (Highest value; directly addresses the +0.2 intent soft spot.)
- **Resolve the two-price ambiguity:** make the headline price and the CTA price the same anchor, or label them explicitly ("your size, new" vs "from"). Now-confident price makes this mismatch more visible.
- **Collapse "Where it sells" behind the Buy button** as an expandable "Other places to buy", so retail rows stop competing with the primary action above the fold. (Carried over from 6/28 — the editorial pass makes it more relevant, not less.)
- **Real retailer logos** (small static SVG set) to replace text monograms — #1 trust drag, carried from 6/28.
- **Data-driven resale price** to replace flat 50% — carried from 6/28.

## Limits
Modeled aggregate — directional confidence high, absolute decimals low. Treat as a confirmation signal, not measured KPIs. The two items that deserve real instrumentation before closing: (1) purchase-intent effect of the quieter CTA (A/B glow-less + anchored vs baseline), (2) the two-price ambiguity. Everything aesthetic/trust the pass touched, the panel confirms as a win.
