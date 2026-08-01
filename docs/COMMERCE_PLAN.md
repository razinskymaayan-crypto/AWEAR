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
1. Sign up to an affiliate network with instant approval (**Skimlinks or Sovrn**) → get publisher ID. *(founder, ~10 min)*
2. Replace placeholder `AFFILIATE_TAG = "awear"` in `app.py` with the real ID; make `affiliate_url()` build
   real deep-links **with the SubID** (`poster_id:post_id:item_id`).
3. Buy button → open **in-app webview** (Capacitor Browser plugin) on the deep-link. *(code)*

**Part B — The real work:**
4. **Poster-side tagging** flow: on post-create, Vision proposes items → poster confirms/pastes product URL.
5. **Item status** resolver (buyable / find-similar / resale) + the three-tier Buy UI.
6. **Conversion → tokens:** ingest the network's postback → match SubID → credit poster's wallet
   (pending → confirmed after the return window).

## Decisions still needed from the founder
1. **Which affiliate network** to start with (recommend **Skimlinks** — broad fashion catalog, instant, SubID support).
2. **Token economics:** poster's share of commission (proposed **40%**) and what a token redeems for
   (proposed: **credit toward own purchases** first, cashout later).
3. **Token → money peg:** is 1 token = $0.01 of credit? (proposed, simple.)

## What is NOT in scope (rejected)
- Bot-automated payment / auto-checkout on retailer sites (voids commission, illegal-ish, breaks).
- Dropship-aggregator fakes for "exact brand" items (ships counterfeits).
- Holding inventory / wholesale (no margin path by launch; requires per-brand deals).
- Concierge markup / merchant-of-record — parked; revisit only for specific high-demand brands + ACP later.

## The future rail (park, don't build yet)
**Stripe Agentic Commerce (ACP) + Visa Intelligent Commerce** — sanctioned rails where brands OPT IN to let
an app's agent purchase on the user's behalf. This is the legitimate version of "fully in-app auto-buy."
Nascent (2026), few brands (Coach, Kate Spade, URBN, Etsy) but growing. Migrate onto it as it matures.
