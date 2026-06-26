# AWEAR — Creator Credits Economics

> **Track B2** (per `MASTER_PLAN.md`). Owner: Jeff + Ayalon. Backs **Pitch Deck Slide 5** (Business Model) and the Creator Wallet demo moment.
> **Locked economics** (commission %, resale %, forecasts) follow board decision #9 and may only be changed by Carmel + Razi. This doc *documents* them; it does not change them.
> Status: **v1 — investor-ready draft.** Last updated 2026-06-26.

---

## 1. One-paragraph summary

Every shoppable look in the AWEAR feed carries an `influencer_id`. When a viewer buys that look in-app, the order is attributed to the creator and the creator is credited **5% of the order value** into an **append-only, idempotent ledger**. The creator's **Wallet** shows their live balance and earnings history. Payouts unlock above a **$25 minimum** and are simulated in the investor demo (real money rails = Stripe Connect, post-investment). This is the same attribution model the affiliate-marketing world already runs at scale — we are not inventing it, we are wiring it natively into the closet.

---

## 2. The credit event (what actually triggers a payout)

Anchored to the implemented backend — `POST /api/orders` in `app.py`:

```
post carries influencer_id
  → viewer taps "Buy the look" (in-app checkout)
  → POST /api/orders { product_id, amount_usd, influencer_id, ... }   # handler: create_order()
  → one row written to `orders` (status = "completed")
  → if influencer_id present:
        credit_amount = round(amount_usd * 0.05, 2)     # 5% creator share
        one row written to `credits` (type = "creator")
  → GET /api/wallet returns { balance, credits[] }, each row { id, item, amount, order_id, created_at }
```

**Creator take-rate: 5% of attributed GMV.** Source of truth: the literal `amount_usd * 0.05` in `create_order()` (`app.py`) — the 5% is a hardcoded credit rate, *independent* of `AWEAR_COMMISSION_PCT` (which governs resale, not creator credits). There is **no double-charging the buyer** — the credit is funded out of the affiliate commission AWEAR earns from the retailer, not added on top of the price the user pays.

---

## 3. Take-rate split — where the money comes from

For **shoppable affiliate purchases** (Layer 2 — Shop-the-Look), the retailer pays AWEAR an affiliate commission (**5–15%** of order value, per network). AWEAR pays the creator 5% of order value out of that commission.

**Worked example — $80 jacket, retailer affiliate rate 10%:**

| Party | Amount | Note |
|-------|--------|------|
| Buyer pays | $80.00 | same price as buying direct — no markup |
| Retailer → AWEAR (affiliate) | $8.00 | 10% of $80 |
| AWEAR → Creator (credit) | $4.00 | 5% of $80 (`amount_usd * 0.05`) |
| **AWEAR net** | **$4.00** | affiliate commission minus creator share |

At a 10% affiliate rate the split is effectively **50/50 between AWEAR and the creator**. At lower retailer rates AWEAR's net compresses; at higher rates it widens. The creator's 5% is **fixed and predictable** — which is exactly what makes it a credible growth incentive for Founding Creators.

> **Edge case — affiliate rate below 5%:** if a retailer pays AWEAR less than 5%, the fixed creator credit would exceed AWEAR's commission. v1 policy: route only retailers/networks at **≥ 8% affiliate** into shoppable feed inventory, preserving a positive AWEAR net on every credited order. (Operational rule — adjust as networks are signed.)

---

## 4. The ledger — why investors can trust the number

The `credits` table is **append-only**: credits are inserted, never edited or deleted. Each row is tied to exactly one `order_id`, which makes attribution **idempotent** — re-processing an order cannot double-pay a creator. Balance is the sum of the creator's credit rows, so the Wallet balance is always reconstructible from the order history. (v1 implementation note: `/api/wallet` displays and sums the most recent 50 credit rows; a full-history aggregation is a trivial extension and does not affect the demo.) This mirrors board decision #11 ("Creator credits: ledger append-only, idempotent").

```
credits(id, user_key, order_id, item_name, amount_usd, type, created_at)
orders (id, user_key, product_id, amount_usd, status, influencer_id, created_at)
```

**For the demo:** the Wallet renders a real balance computed from seeded credit rows — not a hardcoded string. The "creator earned $X" closing beat is backed by the same `GET /api/wallet` the production app uses.

---

## 5. Withdrawal threshold & payout rails

| Parameter | v1 value | Rationale |
|-----------|----------|-----------|
| Minimum withdrawal | **$25** | Above per-payout processor fees; standard floor for creator platforms (cf. typical $20–50 affiliate minimums). Keeps payout cost-efficient. |
| Payout cadence | On-demand above threshold | Creator pulls when ready; no forced schedule. |
| Demo behavior | **Simulated** — "Withdraw" confirms instantly, balance updates locally | No real money moves in the investor demo. |
| Production rails | **Stripe Connect** (post-investment) | KYC + payout compliance handled by Stripe; out of $80K seed scope. |

> The **$25 threshold is operational, not locked economics**, so it can ship in v1. It is flagged in `TODO_FOR_TAMAR.md` for founder confirmation before the deck is finalized — if the founders prefer a different floor it is a one-constant change.

---

## 6. Interplay with resale commission (Layer 3)

Resale is a separate, peer-to-peer flow and does **not** generate creator credits (the seller *is* the earner):

- Suggested resale price = **50%** of original estimate (`RESALE_SUGGESTION_PCT = 0.5`).
- AWEAR commission on a completed resale = **15%** of sale price (`AWEAR_COMMISSION_PCT = 0.15`).

**Worked example — $100 original item:** suggested resale $50 → AWEAR keeps $7.50 (15%) → seller receives $42.50. Both numbers are board-locked (decision #9).

---

## 7. Partnership path — affiliate day-1 → retailers at scale

Creator credits are the **growth flywheel** layered on top of the three-stage revenue model:

1. **Day 1 — Affiliate (live, zero-risk):** AWIN / Rakuten / Sovrn / Impact / CJ approve a publisher in days, no volume requirement. `affiliate_url()` is the single revenue insertion point — sign a network, swap one line, every "Buy" button earns. Creator credits run on top from the first attributed sale.
2. **At scale — Dropshipping suppliers:** Spocket / Zendrop / CJ Dropshipping + Israeli D2C brands. Higher margin → larger creator-credit pool possible without squeezing AWEAR net.
3. **Post-PMF — Retailer partnerships:** once 1,000+ active users prove purchase intent, direct retailer/brand deals raise the effective take-rate; the same fixed 5% creator credit becomes a recruiting magnet for Founding Creators because their payout is unchanged while AWEAR's margin grows.

**Why this is defensible:** the creator-credit ledger compounds with the knowledge graph (board moat #1). The more a creator's looks convert, the higher their balance and the higher their switching cost — a new competitor starts every creator at a zero balance with zero earnings history.

---

## 8. Unit-economics roll-up (consistency check vs MASTER_PLAN / deck)

| Metric | Value | Source |
|--------|-------|--------|
| Creator credit (shoppable) | 5% of GMV | `amount_usd * 0.05` |
| AWEAR commission (resale) | 15% | decision #9 |
| Resale suggestion | 50% of original | decision #9 |
| Contribution / user / month | ~$11 | MASTER_PLAN §ז |
| Gross margin | ~85% | MASTER_PLAN §ז |
| Withdrawal minimum | $25 | this doc (operational) |

These figures match `MASTER_PLAN.md` §ז and `PITCH_DECK.md` Slide 5/6. Any future change to the locked rows requires founder sign-off and a synced update across all three documents.

---

## 9. Implemented vs simulated (honesty slide for investors)

| Capability | State |
|------------|-------|
| Order attribution to `influencer_id` | ✅ implemented (`/api/orders`) |
| 5% credit written to append-only ledger | ✅ implemented |
| Wallet balance + history from real query | ✅ implemented (`/api/wallet`) |
| Affiliate revenue insertion point | ✅ stubbed (`affiliate_url()`), one-line to go live |
| Real money payout (Stripe Connect) | ⏳ post-investment |
| Withdraw button | 🎬 simulated in demo |

---

## 10. Open decisions for founders

1. **Confirm $25 withdrawal minimum** (or set preferred floor) — tracked in `TODO_FOR_TAMAR.md`.
2. **Confirm ≥ 8% minimum affiliate rate** for shoppable inventory (protects AWEAR net on credited orders).
3. Any change to the **5% creator share** is an economics change → requires board sign-off + synced update here, in `MASTER_PLAN.md`, and `PITCH_DECK.md`.
