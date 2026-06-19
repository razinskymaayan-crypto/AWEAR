# Multi-Currency Layer — Planning Doc
Author: Oren (Integration Engineer) · Date: 2026-06-18 · Status: PLANNING ONLY, no code changed

## 0. Why this exists
AWEAR pivoted to global-first (see `3ada356 Global-first backend: remove Israel-specific
assumptions`), but pricing was never migrated. Every price in the product is still a bare
integer assumed to be ILS (and the AI prompt that generates it is internally inconsistent
about which currency it's even estimating — see 1.1). This doc inventories every hardcoded
ILS/₪ touchpoint, then proposes how to make price a real `{amount, currency}` concept instead
of a naked number. No `index.html` or `app.py` edits were made — this is scoping only.

---

## 1. Inventory

### 1.1 Where prices are generated (backend, `app.py`)
- `ClothingItem.price_estimate_ils: int` (line 55) — Pydantic field on every AI-identified
  clothing item. **Bug worth noting**: the docstring says "estimated retail price in ILS"
  but the `SYSTEM_PROMPT` sent to Claude (line 86) says *"price_estimate_ils (estimated
  retail price in USD — use integer)"*. The field name, the model docstring, and the actual
  prompt instruction disagree on currency. Today this "works" only because nothing in the
  app distinguishes currencies — it's all just rendered with a ₪ glyph regardless of what
  the model actually estimated.
- `_DEMO_OUTFITS` (lines 130–197) — hardcoded fallback dataset, every item has a
  `price_estimate_ils` integer (25, 80, 120, 150, 70, 60, 35, 90, 110, 30).
- `/api/analyze` (line 220+): sums `item.get("price_estimate_ils")` into
  `result["look_total_ils"]` (lines 268–272) — a derived/computed price field, not just passthrough.
- `/api/declutter` (line 418+): builds an LLM prompt that embeds `price_estimate_ils` as
  plain numbers (line 426), and computes `price_suggestion` as `price_estimate_ils * 0.4`
  (line 451) — **price used in arithmetic, not just display**.
- `MeetingSummary` / other endpoints: no currency fields, not in scope.

### 1.2 Where prices are displayed (frontend, `static/index.html`)
~70 distinct ₪ occurrences. Categories:
- **Item/product cards & sheets**: lines 1564, 1577, 1692, 1705, 1722, 1925, 1948, 2144,
  2175/2178, 3035, 3101, 3750, 4576/4577, 4642, 4675 — all interpolate
  `it.price_estimate_ils` / `it.price` directly next to a literal `₪`.
- **Wardrobe/closet value aggregates**: lines 2011, 2050, 2358, 2409, 2571, 2594, 4332, 4350
  — `wardrobe.reduce((s,i)=>s+(i.price_estimate_ils||0),0)` then rendered with `₪` and ad hoc
  `.toFixed(1)+'K'` formatting (no `Intl.NumberFormat`, no locale awareness anywhere in the file).
- **Cost-Per-Wear (CPW) analytics**: lines 2600, 2638, 2937, 2967, 3296/3297, 3320, 3340,
  4353, 4361 — price divided by `wear_count`, formatted with `Math.round` and a hardcoded ₪.
- **Marketplace / resale flow**: lines 1800, 1818, 1925–1928, 1998/1999, 3064, 3083, 3092,
  3134, 3157, 3182/3184, 3198, 3295, 3316, 3354, 3381/3400 — resale price = 50% (or 40-60%,
  inconsistent across call sites) of `price_estimate_ils`, computed client-side, then shown
  with ₪. The "AI suggests ₪X — 50% of purchase price" copy (line 3184) and the declutter
  60%/40% split in `app.py` are two independently-hardcoded resale-percentage rules.
- **Influencer earnings / commission lines**: lines 1552, 1728, 1798, 2129, 1999 — "Awear
  15%" commission and influencer "earn" amounts, all in ₪.
- **Stylist marketplace listings**: lines 4391–4396 — hardcoded stylist hourly rates as
  *strings* (`'₪150/שעה'`), not even numeric — worse than the item-price case since the ₪
  and the unit are baked into the data, not just the renderer.
- **Onboarding quiz budget tiers**: lines 3803–3806 — `'עד ₪200'`, `'₪200–500'`,
  `'₪500–1000'`, `'₪1000+'` as quiz answer labels. This is **logic-adjacent**: `quizAnswers.budget`
  is stored and presumably meant to drive personalization/recommendation later, so the bands
  themselves (not just their display) are currency-specific and will misclassify a non-Israeli
  user's actual budget tier.
- **Demo/seed content**: `SHOP_SEED`, social feed seed posts (lines 2103–2109), exchange
  cards, all carry plain-integer `price` fields with the same implicit-ILS assumption.

### 1.3 Where price is used in *logic*, not just display
This is the part that matters most for scoping the migration safely:
1. `app.py` `/api/declutter`: `price_suggestion = price_estimate_ils * 0.4` — arithmetic on price.
2. `app.py` `/api/analyze`: `look_total = sum(price_estimate_ils)` — derived aggregate field
   sent to the client (`look_total_ils`).
3. Frontend resale/marketplace flow: multiple independent `* 0.5` / `* 0.4` / `*.5` multipliers
   scattered across lines 1846, 1928, 2011 (closet value), 3064, 3134, 3182 — resale pricing
   logic is duplicated client-side in at least 4 places with slightly different percentages.
4. Frontend CPW (cost-per-wear): `price_estimate_ils / wear_count` — used to generate
   "smart" labels (`✓ יפה` vs `↑`) at hardcoded ILS thresholds (`avgCPW < 30`, `< 20`, `> 100`,
   `unusedValue > 500` at lines 2967, 3296/3297, 3295) — **these thresholds are currency-magnitude-specific
   and will be silently wrong for any non-ILS currency** (e.g. 30 ILS ≈ 8 USD; the same
   threshold applied to USD-denominated prices would flag almost everything as cheap).
5. Onboarding quiz budget bands (1.2 above) feed into `quizAnswers` — currently unclear if
   anything downstream filters/recommends by this, but the bands are currency-shaped, so any
   future use is already broken for non-ILS users.

**Bottom line**: this isn't just a label/glyph swap. There are real numeric thresholds and
percentage-based computations baked in at both ILS-specific magnitudes and inconsistent
percentages, plus one outright prompt/field-name contradiction (USD vs ILS) already live in
production.

---

## 2. Proposed architecture for a multi-currency layer

### 2.1 Canonical internal representation
Stop storing a bare number. Represent every price as a structured value:
```
{ "amount_minor": 2500, "currency": "USD" }   // minor units (cents) avoids float rounding
```
or, if minor-unit migration is too invasive for v1, at minimum:
```
{ "amount": 25.0, "currency": "USD" }
```
- Pick ONE canonical storage currency for anything generated by the AI (recommend USD,
  since the Claude prompt already silently intends USD per the docstring contradiction in
  1.1 — this is the cheapest fix: make the code match what the prompt already says).
- Every `ClothingItem`-like object becomes `{price_amount, price_currency}` instead of
  `price_estimate_ils`. Rename the field — `price_estimate_ils` is actively misleading and
  should not survive into a multi-currency world even as a legacy alias, since it asserts a
  currency in the name itself.
- Derived/aggregate fields (`look_total_ils`, closet value, CPW) must carry the same
  `{amount, currency}` shape, not a bare number — otherwise the inconsistency just moves
  one layer up.
- All resale/declutter percentage math (the `*0.4`/`*0.5` multipliers found in 1.3) operates
  on `amount` only, currency passes through unchanged — percentages are currency-agnostic by
  definition, which is the one part of the existing logic that's already safe to keep as-is.
- CPW/budget threshold logic (1.3 item 4) **cannot** stay as raw magnitude comparisons once
  multi-currency lands — thresholds must be defined in one reference currency and converted,
  or computed against a normalized amount. This is a real engineering task, not a label change.

### 2.2 Exchange rate data — sourcing
Two sub-decisions, both flagged below in section 3 as needing a product/business call:
- **Live FX rates**: would require a third-party FX API (e.g. exchangerate.host,
  Open Exchange Rates, currencyapi.com, fixer.io). Free tiers exist but are typically
  rate-limited, capped on monthly requests, and/or restrict commercial use — **same category
  of decision as the pollinations.ai image API flag**: I will not silently wire in a paid
  vendor or quietly rely on an unstable free tier without sign-off. If leadership wants true
  live FX, this needs a budget line and a vendor choice, not an engineering workaround.
- **Static reference table**: a small JSON/DB table of fixed rates (e.g. updated weekly/monthly
  by a cron job or manually), zero ongoing vendor cost, "good enough" for display purposes
  since AWEAR isn't processing real payments through this price field today (it's an estimate/
  shop-the-look price, not a checkout charge). This is the low-cost path and is my recommendation
  for v1 — but it's still a product call (see section 3).
- Either way: exchange rate value itself should be cached server-side (not fetched per-request),
  with a clear `rates_updated_at` timestamp so staleness is visible, not silent — consistent
  with the "fail loud, not silently" principle already in my role profile.

### 2.3 Display formatting per locale
- Use `Intl.NumberFormat(locale, {style: 'currency', currency})` in the frontend instead of
  the current pattern of string-concatenating a literal `₪`/`$` glyph next to a number. This
  single API call correctly handles symbol placement (prefix vs suffix), decimal separator
  (`.` vs `,`), digit grouping, and the right number of decimal places per currency (e.g. JPY
  has 0 decimals, most others have 2) — all of which are currently wrong-by-construction since
  the code hardcodes `₪` + raw integer everywhere.
- Locale should come from the user's profile/browser locale (`navigator.language`) or an
  explicit user setting, not inferred from currency — these are independent axes (e.g. a
  USD price shown to a German-locale user should still read "25,00 $" not "$25.00").
- The frontend's `<html lang="he" dir="rtl">` (line 2 of `index.html`) is itself a leftover
  Israel-only assumption — the whole document is hardcoded Hebrew/RTL with no i18n
  infrastructure (no locale switch, no translation table, `lang`/`dir` are static attributes).
  Currency display formatting will be inconsistent/awkward until that's addressed too, though
  that's a larger i18n effort beyond this currency-specific doc — flagging it here so it isn't
  rediscovered as a surprise mid-implementation.

### 2.4 Suggested phased build (engineering-only steps, pending the product decision in §3)
1. Fix the prompt/field-name contradiction: rename `price_estimate_ils` →
   `price_estimate_usd` (or `price_estimate` + explicit `currency: "USD"`), matching what the
   prompt already instructs Claude to return. Lowest-risk, highest-value first step.
2. Introduce `{amount, currency}` shape on the backend response contract for items,
   look-total, and declutter suggestions. Coordinate the schema change with Sam per my normal
   scope boundary (schema changes need Sam's sign-off).
3. Add a backend currency-conversion helper fed by the reference-rate table from §2.2,
   exposed via a small `/api/fx` endpoint or embedded in existing responses.
4. Replace every frontend `₪${...}` string-template occurrence (full list in §1.2) with a
   shared `formatPrice(amount, currency, locale)` helper built on `Intl.NumberFormat`.
5. Fix the CPW/budget magnitude thresholds (§1.3 item 4) to operate on a normalized currency
   rather than raw numbers.
6. Consolidate the duplicated resale-percentage logic (currently 4+ independent `*0.4`/`*0.5`
   call sites across frontend + backend) into one shared function, while we're touching this
   code anyway.
7. Replace the hardcoded stylist-rate strings (`'₪150/שעה'`) with structured `{amount,
   currency, unit}` data.

---

## 3. Open questions — PRODUCT/BUSINESS DECISIONS, not mine to make

Flagging these for Ayalon/the board before any implementation starts, same way the team
previously flagged the pollinations.ai image API as a budget/vendor decision rather than
silently working around it:

1. **Live FX rates vs. fixed reference table** — does AWEAR want real-time/near-real-time
   exchange rates (requires a paid or rate-limited third-party FX API — ongoing vendor cost
   and a dependency to manage), or is a periodically-updated static table acceptable given
   that these are *estimated shop-the-look prices*, not actual payment-processing amounts?
   My engineering recommendation is the static table for v1 (zero vendor cost, simpler,
   "good enough" for a price *estimate*), but this is a product/budget call, not mine.
2. **If live rates are wanted**: which vendor, and who owns the budget line? (Same category
   of decision as the pollinations.ai flag.)
3. **Canonical storage currency** — I'm recommending USD (since the existing Claude prompt
   already silently assumes USD), but if AWEAR's primary market/finance reporting currency
   is something else (EUR? still ILS for now despite the pivot?), that changes the answer.
   This affects how "estimate accuracy" reads to users in different markets and may be a
   finance/ops question as much as a product one.
3. **Resale/commission percentages** — the codebase currently has at least three different
   undocumented resale percentages (40%, 50%, 60%) and a 15% Awear commission rate scattered
   across both files. Should there be ONE canonical resale-percentage policy, and is 15%
   commission still the intended number post-pivot? Worth confirming with product/finance
   while this code is being touched anyway, even though it's tangential to currency itself.
4. **Per-market pricing display, not just conversion** — should prices simply be FX-converted
   from a USD estimate, or does AWEAR eventually want actual region-aware pricing (e.g.
   reflecting real local retail price differences, not just an FX multiply)? That's a much
   bigger product question about whether "price_estimate" should mean "what this probably
   costs where you are" vs. "USD price converted at today's rate" — worth deciding now even
   if v1 only implements the simpler conversion, so the field semantics are documented
   correctly from day one.

---

## 4. Risk classification

**Low-risk, can start now (no product decision needed):**
- Fixing the `price_estimate_ils`/USD prompt contradiction (§2.4 step 1).
- Introducing the `{amount, currency}` shape as the response contract (additive, can be
  done with `price_estimate_ils` kept temporarily as a deprecated alias during transition).
- Building the `formatPrice()` / `Intl.NumberFormat` frontend helper (works with any rate source).
- Consolidating the duplicated resale-percentage constants into one place.

**Needs a product/business decision before implementation (§3):**
- Live FX API vendor + budget approval.
- Canonical storage currency choice (if not USD).
- Resale percentage / commission rate policy.
- "Converted estimate" vs. "real local price" product positioning.

**Needs Sam's sign-off (per my normal scope boundary):**
- Any schema change to `ClothingItem`, wardrobe storage, or marketplace listing models.

---

Status: requires approval — this is a planning document only. No code in `index.html` or
`app.py` was modified. Next step on my side, pending direction: draft the actual schema
change for Sam's review (step 2 of §2.4) once §3's open questions are answered.
