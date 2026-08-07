# AWEAR — Commerce Model (LOCKED)

> The founder-approved commerce architecture. All agents build to THIS. Do not re-litigate the model;
> if a decision here is wrong, escalate to the founder — don't silently diverge.
> Grounded in the overnight deliberation (supply/commerce/tech/feasibility) + founder alignment 2026-08.

## The model in one line
A user sees an item in someone's post → taps **Buy** → an **in-app browser** opens the **exact product**
via AWEAR's **affiliate deep-link** → the user pays with **their own Apple Pay / saved card** (2–3 taps) →
AWEAR earns the **affiliate commission** → the **poster earns tokens** (a share of that commission).

## Why this model (and not the alternatives)
- **NOT full auto-purchase by a bot.** Auto-filling the customer's payment on a retailer site VOIDS the
  affiliate commission (networks require a genuine user session, not a script), creates PCI/fraud/bot-
  detection problems, and violates retailer + network ToS. Dead end.
- **The line:** automate EVERYTHING up to payment (deep-link to the exact item, pre-select size, in-app
  webview). The **user makes the payment themselves** with Apple Pay — that single human step is what
  keeps the commission valid and legal. It's 2–3 taps, so it still feels in-app.
- **Affiliate = the only model that gives commission + full brand catalog + zero fulfillment risk.**
  The retailer PAYS us for the referral; we hold no inventory, front no money, own no returns.
  This is the LTK / ShopMy model — proven.

## Item availability — every look stays fully shoppable
Each item in a post gets a **status**; never show a dead Buy button:
| Status | Trigger | Action |
|---|---|---|
| ✅ Buyable | in stock, current | **Buy exact** — affiliate deep-link, in-app webview |
| 🔄 Find similar | discontinued / sold out / off-season | AI matches an **available** lookalike you can buy |
| ♻️ Resale | vintage / thrifted / gifted | **Search resale** (Depop / Vinted / eBay / Vestiaire) + AWEAR preloved (already in code) |

The "old items" problem becomes MORE revenue surface: "find similar" and resale both monetize (resale
networks have affiliate programs; AWEAR preloved earns its own commission).

## Poster-earns-tokens architecture (the creator loop = the "wow")
1. **SubID attribution.** Affiliate networks support a sub-parameter (Skimlinks `xcust`, Impact `subId1`,
   Sovrn). Encode `poster_id:post_id:item_id` into every affiliate link.
2. Buyer taps Buy on poster A's post → the deep-link carries A's SubID.
3. Buyer completes purchase → the **network postback/report** returns that SubID → AWEAR knows the sale
   came from A's post. **The network is the source of truth** — we don't see the purchase directly.
4. AWEAR credits A's **wallet** (`/api/wallet` already exists) with **pending tokens** = a share of the
   commission (proposed: poster gets ~40% of AWEAR's commission as tokens; AWEAR keeps the rest).
5. After the **return window (~30 days)** the tokens move **pending → confirmed** → spendable as
   **credit toward A's own purchases** (keeps value in the ecosystem; cashout later).

Key truth: tokens are **pending → confirmed**, never instant — because a purchase can be returned and the
commission clawed back.

## The real hard part (where effort goes)
Not the plumbing — **resolving a feed photo to the EXACT product URL.** CV alone gets ~10–40% on arbitrary
UGC. The fix is **poster-side tagging (LTK model):** when a user posts, Vision *proposes* the products, the
**poster confirms or pastes the real product URL.** A human confirmed it → "exact" is honest, not guessed.
Auto-detection stays an assist, never the source of truth for a purchase.

## Build order
**Part A — Plumbing (days):**
1. ✅ Sign up to an affiliate network with instant approval (**Skimlinks**) → get publisher ID. *(founder — done)*
2. ✅ Replace placeholder `AFFILIATE_TAG = "awear"` → real Skimlinks ID + `affiliate_url()` with SubID (`poster_id:post_id`). Commit `a6e799f`. 7 hermetic pytests, commit `91be81f`.
3. ✅ Buy button → open **in-app webview** (Capacitor Browser plugin) on the deep-link. Commit `f3d9a4a`.

**Part B — The real work:**
4. ✅ **Poster-side tagging** flow: "Source link" field in scan-confirm, badged + URL validation + "earns tokens" hint. Commit `28ce450`.
5. ✅ **Item status** resolver (buyable / find-similar / resale) + three-tier Buy UI in look-sheet. Commits `268a850` (status resolver) + `54ae5f6` (per-item Buy button).
6. ✅ **Conversion → tokens:** `/api/skimlinks/postback` ingests network postback → matches SubID → credits poster's wallet (pending → confirmed after return window). Commits `b19c904` + `70b80ed` (race dedup). 8 hermetic pytests.

**Part C — All shipped:**
7. ✅ **Find-similar endpoint** — `/api/find-similar` at `app.py:2162`: returns in-stock catalog lookalikes via `_match_score`. 3 hermetic pytests (`tests/test_app.py:3680`). UI "Find Similar" button at `app.js:747` currently routes to Google Shopping as practical fallback; catalog endpoint available for deeper UI wiring. Commit `d4f08bc`. **Attribution gap closed (commit `b9597d1`):** `buy_url` in every returned alternative now carries `xcust=poster_id:post_id` when the caller supplies `poster_id`+`post_id` — Skimlinks postback now credits the correct poster for find-similar purchases.
8. ✅ **Wallet UI** — `renderWallet()` at `app.js:4015`: shows confirmed earnings (green) + pending banner (amber, "clears after 30-day return window") separately; `normalizeCredit()` handles old localStorage + new API format; fires async `GET /api/wallet?user_id=tamar`; "How it works" copy: "~40% of AWEAR's affiliate commission". Commit `41c83e3`. **Attribution gap also closed for resolve-product (commit `b9597d1`):** `GET /api/resolve-product` now accepts `poster_id`+`post_id` and embeds `xcust=poster_id:post_id` in every returned `buy_url` (exact match + alternatives). 4 hermetic pytests prove xcust-present and xcust-absent paths.

## Decisions made (shipped in code — do not re-open)
1. ✅ **Affiliate network: Skimlinks** — `SKIMLINKS_ID = "307075X1795350"` live in `app.py:347`. Instant approval, broad fashion catalog, `xcust` SubID for poster attribution. Confirmed 2026-08-01.
2. ✅ **Token economics: 40% of AWEAR's commission** — `SKIMLINKS_CREATOR_SHARE_PCT = 0.40` in `app.py:360`. Credits stored as USD amounts in `credits` table. Status: `pending` until return window passes, then `confirmed` via `/api/skimlinks/confirm-pending`. Confirmed 2026-08-01.
3. ⬜ **Token → money peg** (still open): Wallet UI ships displaying raw USD amounts (`$X.XX`). Whether to add a "tokens" abstraction layer (1 token = $0.01) is a UX display decision only — founder to decide; no code change blocks the demo.

## What is NOT in scope (rejected)
- Bot-automated payment / auto-checkout on retailer sites (voids commission, illegal-ish, breaks).
- Dropship-aggregator fakes for "exact brand" items (ships counterfeits).
- Holding inventory / wholesale (no margin path by launch; requires per-brand deals).
- Concierge markup / merchant-of-record — parked; revisit only for specific high-demand brands + ACP later.

## The future rail (park, don't build yet)
**Stripe Agentic Commerce (ACP) + Visa Intelligent Commerce** — sanctioned rails where brands OPT IN to let
an app's agent purchase on the user's behalf. This is the legitimate version of "fully in-app auto-buy."
Nascent (2026), few brands (Coach, Kate Spade, URBN, Etsy) but growing. Migrate onto it as it matures.
