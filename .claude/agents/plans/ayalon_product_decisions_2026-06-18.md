# Product Decisions — Currency & i18n Open Questions

Author: Ayalon (Product Director) · Date: 2026-06-18
Source docs: `agents/plans/oren_currency_plan_2026-06-18.md`, `agents/plans/roei_i18n_plan_2026-06-18.md`
Status: DECIDED — engineering is unblocked on every item below.

---

## Currency layer (responding to Oren's plan, §3)

### 1. Canonical internal storage currency: **USD**

**Decision:** Store every price internally as `{amount, currency: "USD"}`. Rename
`price_estimate_ils` → `price_estimate_usd` (or `price_estimate` + explicit `currency` field).

**Reasoning:** The Claude Vision prompt already estimates in USD — this just makes the
field name match the behavior we already ship today. USD is also the most defensible
single reference currency for a global-first product with no fixed home market yet.

**Reversible:** Yes, but expensive later. Once items/wardrobes/marketplace listings are
persisted with a currency field, changing the canonical currency means a backfill
migration, not a config flip. Low risk now (nothing is migrated yet) — get it right this
pass rather than revisit.

---

### 2. FX rate sourcing: **static/periodic reference table for v1. Live paid API is explicitly NOT approved.**

**Decision:** Ship a static, manually/cron-updated FX reference table (Oren's
recommendation). Do not integrate any paid or rate-limited third-party FX API
(exchangerate.host, Open Exchange Rates, currencyapi.com, fixer.io, etc.) without
separate sign-off.

**Reasoning:** These are display-only "shop the look" price estimates, not
payment-processing amounts — accuracy-to-the-day doesn't matter yet, and it's not worth
a vendor dependency before we have any signal that users care.

**Reversible:** Yes, by design. Cache rates server-side with a visible
`rates_updated_at` timestamp (per Oren's §2.2) so staleness is never silent, and treat
"conversion accuracy" as a metric to watch. If it becomes a recurring user complaint or
a sales-blocking issue, that's the trigger to revisit — not before.

**Budget flag — explicit, not my call:** Moving to a live paid FX API is a vendor/budget
decision in the same category as the pollinations.ai image API flag. I am not approving
a vendor or a spend line here. If/when we want live rates, that needs Jeff/board
sign-off on which vendor and who owns the budget line. Engineering should build the
conversion layer so that swapping the rate *source* later (static table → live API) is
a config/adapter change, not a rearchitecture — but the actual vendor decision sits with
the board, not with me or with engineering.

---

### 3. Resale/commission percentages: **Canonicalize now — 50% resale-suggestion multiplier, 15% commission. Kill the 40%/60% variants.**

**Decision:**
- Standard resale price suggestion = **50%** of estimated purchase price (`amount * 0.5`).
  This is the value already used in 3 of 4 frontend call sites (lines ~3096, 3147, 3195
  in `static/index.html`) — the backend's `* 0.4` in `app.py`'s `/api/declutter` (line
  451) and the frontend declutter line (~3394, also `*0.4`) are the outliers and should
  be changed to match `0.5`, not the reverse.
- Awear commission stays **15%**, applied on top of (not instead of) the 50% resale
  suggestion — i.e., seller suggested price is 50% of original estimate; Awear takes 15%
  of the sale price as commission. These are two independent numbers, not competing
  definitions, and should be named distinctly in code (`RESALE_SUGGESTION_PCT = 0.5`,
  `AWEAR_COMMISSION_PCT = 0.15`) so they stop colliding in review.
- Consolidate into one shared constant/function per Oren's §2.4 step 6, used by both
  `app.py` and `static/index.html` — no more independently-hardcoded multipliers at 4+
  call sites.

**Reasoning:** 50% is already the majority pattern in the live code, so standardizing on
it is the lowest-disruption fix and matches what most users have already seen in the
product. 15% commission is unchanged from today's stated rate — no reason found in
either plan to change it, and changing pricing/commission economics is a bigger finance
conversation than this cleanup warrants.

**Reversible:** Yes, easily — once these are named constants in one place instead of
scattered literals, changing either percentage later is a one-line edit. This is exactly
the kind of decision worth getting "good enough" now and revisiting with real
marketplace data once we have transaction volume.

**Not decided here (deferred, not blocking):** Oren's §3.4 question about
"converted-USD estimate" vs. "real local market price" is a bigger product question
about what `price_estimate` *means*. Decision: v1 ships as a converted estimate (USD
amount × static FX rate), clearly should the field/copy ever say "estimated" rather than
implying precision. Revisit true region-aware pricing only if/when we have local market
data partnerships — not in scope for this pass.

---

## i18n plan (responding to Roei's plan, §5)

### 4. Screen rollout order: **Approved as proposed — highest-traffic-first.**

**Decision:** Go with Roei's phase order as written (Infra → Nav/Onboarding → Home →
Feed → Closet → Toasts sweep → Marketplace/Compare → Chat → Outfit/Wishlist/Explore →
Analytics/Rewards/Sustainability/Seasonal/PublicClosets → Stylists → Edit profile),
with Admin excluded (see #6).

**Reasoning:** Correct prioritization logic for a sprint that might get cut short — a
non-Hebrew user's first impression (onboarding, Home, Feed, Closet) should be in English
before any lower-traffic screen is touched. No change needed.

**Reversible:** Yes, trivially — this is sequencing, not architecture. If priorities
shift mid-sprint (e.g., a marketplace push), reordering phases costs nothing.

---

### 5. Abigail chat copy (1,467 Hebrew chars in `hideChatTyping`) and Stylist chat (401 chars): **Wait for copywriter/tone review. Do not literal-translate now.**

**Decision:** Do not mechanically translate the chat bot's canned personality copy as
part of Phase 7/10. Engineering should wire the `t()` infrastructure and key structure
for these functions (so the mechanism is ready), but leave English values as
placeholders/TODO pending a copy pass, and do not block the rest of the i18n sprint on
this review.

**Reasoning:** This is Abigail's voice/personality, not a UI label — a literal
mechanical translation risks shipping a stylist AI that reads as flat or robotic in
English, which is a worse first impression than staying Hebrew-only a little longer on
this one surface. Tone work needs a copywriter, not a translation pass.

**Reversible:** Yes, but socially costly if done wrong — a flat/awkward bot voice that
ships and gets noticed by users is more visible and harder to walk back gracefully than
simply shipping it later once review is done. Low engineering cost to wait; do so. I
will line up the copy review separately and unblock Phase 7/10 when it's ready —
engineering should treat this as "infrastructure ready, content pending," not stalled.

---

### 6. Admin dashboard: **Confirmed out of scope. Do not localize.**

**Decision:** Admin dashboard (`renderAdminDashboard`, `adminClearLog`) stays
Hebrew-only (or whatever it is today) and is explicitly excluded from the i18n sprint.

**Reasoning:** Internal-only tool, never seen by end users — translating it spends
sprint budget on zero user-facing value.

**Reversible:** Yes, fully — if the admin tool is ever opened to non-Hebrew-speaking
internal staff (e.g., a future hire, an outsourced ops contractor), it can be added to
the i18n backlog at that point with no sunk cost from this decision.

---

## Summary table

| # | Decision | Reversible? |
|---|---|---|
| 1 | Canonical storage currency = USD | Yes, but costly after data migration — get it right now |
| 2 | FX rates: static table for v1; live paid API needs Jeff/board sign-off | Yes, low-cost to revisit |
| 3 | Resale suggestion = 50%, commission = 15%, consolidate into named constants | Yes, easy |
| 4 | i18n rollout order approved as proposed (highest-traffic-first) | Yes, trivial |
| 5 | Chat/stylist canned copy: wait for copywriter review, don't literal-translate now | Yes, but reputationally costly if rushed |
| 6 | Admin dashboard excluded from i18n scope | Yes, fully |
