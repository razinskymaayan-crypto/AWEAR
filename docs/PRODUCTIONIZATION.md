# AWEAR — Productionization Brief ("make it actually work")

> Founder ask (Maayan): stop simulating — answer the hard real-world questions of how AWEAR truly works at scale, and wire the technological solution into the app where possible. This doc is the brief for the agent team (Steve/CTO + Oren/integration + Ayalon/product + CFO + Sam/backend). For each question: the **answer/approach**, **where the tech lives in our code**, and **what's an open founder/budget decision**.

---

## 1. Commerce: affiliate + dropshipping with the world's clothing networks
**The question:** a user taps "Buy" on an item — what really happens, end-to-end, with real retailers, and how do we earn?

**Answer (phased, real from day 1):**
- **Phase 1 — Affiliate (live now, zero brand approval):** join affiliate networks — **Sovrn/Skimlinks, AWIN, Rakuten, Impact, CJ** (they aggregate thousands of fashion retailers: ASOS, Zara, Farfetch, H&M, Nike…). They approve publishers in days, need no sales volume, and pay 5–15% commission on any referred sale. Buy = open the retailer via an affiliate deep-link; we earn commission.
- **Phase 2 — In-app dropshipping (the "never leave the app" UX):** integrate a dropship supplier API (**Spocket, Zendrop, CJ Dropshipping**) so a checkout inside AWEAR places the order + ships, no inventory. Turn on once we have purchase-intent proof + 1k users.

**Where the tech lives:**
- `app.py` → `affiliate_url()` is already the single hook. Swap the placeholder for a real network deep-link builder (per-network publisher ID).
- New: a **product-resolution service** (`/api/resolve-product?q=...` style) that maps a wardrobe item → a real, buyable product + affiliate link. Backed by an affiliate network **product feed** or a shopping-search API.
- `static/index.html` buy flow already routes through a sheet/checkout — point its "buy" at the resolved affiliate/dropship link.

**Open decisions (founder/budget):** which network to join first (Sovrn/Skimlinks = free + easy; AWIN = small deposit). IL-beachhead: also local programs (Terminal X, Factory54). → see §6 MCP.

---

## 1b. The hybrid ONE-TAP Buy model (founder vision)
User stores shipping + payment **once** in AWEAR. Every "Buy" is one tap — no re-entering details on each site. Behind that single button, the backend **routes intelligently** by product source:
| Route | Mechanism | UX | Earn |
|---|---|---|---|
| **Dropship API** (Spocket/Zendrop/CJ) | their API places order + ships | full in-app checkout | margin |
| **Universal-checkout API** (e.g. Rye) | one API checks out at many real retailers | in-app checkout | commission |
| **Affiliate + autofill** | open retailer pre-filled from stored details | near-zero friction | commission |
The user always experiences **one Buy button**; the share of products on the true in-app path grows as we integrate more suppliers/aggregators. *(Avoid a generic bot that fills any site's checkout — fragile + ToS/PCI risk. Use purpose-built APIs.)* Stored payment = tokenized via Stripe.
**Where the tech lives:** `/api/resolve-product` returns `{source: dropship|universal|affiliate, checkout_path}`; the Buy handler picks the path. Profile stores shipping; Stripe stores payment token.

## 1c. Brand coverage matrix — "can we cover every store?"
Almost entirely **yes**, via a mix; only a few luxury houses' *own* sites are closed (covered indirectly):
| Brand type | Direct? | How we cover it |
|---|---|---|
| Mass + premium (Ralph Lauren, Nike, Zara, Levi's, ASOS, Adidas) | ✅ | affiliate network direct |
| Designer (Gucci, Prada, Burberry) | ⚠️ partial | multi-brand luxury retailers w/ affiliate: Farfetch, Net-a-Porter, SSENSE, Mytheresa |
| Ultra-luxury (Louis Vuitton, Chanel, Hermès) | ❌ no affiliate | luxury resale w/ affiliate: Vestiaire Collective, The RealReal, Fashionphile + "shop similar" |
Net: mass+premium direct, designer via luxury platforms, ultra-luxury via resale/"shop similar" — so a user's item is **never** a dead end.

## 2. Edge case: item from 2023 that's no longer sold anywhere
**The question:** user uploads an old/discontinued piece. It isn't on any retailer site. What do we do?

**Answer — a graceful resolution chain (the item ALWAYS keeps value):**
1. **Exact match** — try to find the exact product (affiliate feed / visual+attribute search). If found → buyable, affiliate link.
2. **"Shop similar"** — if not found, surface the closest *currently-available* alternatives (same category/color/silhouette/vibe) via visual/attribute search. The user can buy the look-alike; we still earn.
3. **Archive / own-only** — if nothing matches, the item still lives in the closet as a real owned piece: it counts for stats & cost-per-wear, the **AI stylist still styles it**, and the **resale layer can list it second-hand** (its real liquidity path). It's simply flagged `not_shoppable_new`.

So a discontinued item is never a dead end — it's stylable + resellable, and "shop similar" keeps the commerce loop alive.

**Where the tech lives:** the product-resolution service returns `{status: exact|similar|archive, product?, alternatives?}`. The item card renders "Buy" / "Shop similar" / "In your closet" accordingly. Visual match = image-embedding search (see §3).

---

## 3. The core matching problem: scanned worn garment → clean catalog product
**The question:** the photo is of the user's worn item; the shop needs the clean catalog version. How?

**Answer:** an **image + attribute search**. From the scan we already get `search_query`, category, color, brand_vibe (Claude Vision). Use that to query a product/image search (text-first), and optionally rank by **visual similarity** (CLIP-style image embeddings) against candidate catalog images. Cache results per item. Confidence threshold decides exact vs similar vs archive (§2).

**Where the tech lives:** the `/api/product-image` proxy (built) becomes part of this — extend to return the product + buy link, not just an image. Embedding match is a backend service.

**Open decision:** image-search/match vendor — SerpAPI Google Shopping (paid), affiliate product feeds (free w/ network), or a hosted CLIP search. Budget call.

---

## 4. Creator credits → real bank payout
**The question:** a creator earns credits when people buy via their post — how does that become real withdrawable money?

**Answer:** credits accrue from **our share of the affiliate commission** on attributed sales. Payout to bank = **Stripe Connect** (handles KYC, tax forms, payouts) above a threshold. Attribution = the `orders`/`credits` tables (built) tie purchase → post → earner; reconcile against the network's confirmed-commission report.

**Open decisions:** Stripe Connect setup (legal/tax, real money) — phase 2; threshold + our take-rate split (CFO models it).

---

## 5. Other real-world hard questions (to answer next)
- **Price/stock freshness & returns/shipping** — owned by the dropship supplier (Spocket/Zendrop) APIs; affiliate links always point to live retailer pages.
- **Sizing** — capture user size in profile; pass to retailer link / filter.
- **Counterfeits / brand safety in resale** — moderation + trusted-seller signals.
- **Coverage by market** — IL beachhead first (local + global networks), then expand.

---

## 6. MCP — where it fits (yes, it's relevant)
Connect the agents + app to real services via **MCP connectors** (configurable at claude.ai/customize/connectors), so integration work isn't bespoke per-API:
- **Affiliate networks** (Sovrn/Skimlinks/AWIN) — product feeds + link generation.
- **Shopping/product search** (SerpAPI / Google Shopping) — matching + "shop similar".
- **Stripe** — creator payouts.
- **Image/embedding search** — visual match.
Oren (integration) drives MCP setup once the founders pick vendors.

---

## Open decisions for the founders (needed to go real)
1. **Which affiliate network to join first?** (recommend Sovrn/Skimlinks — free, instant, broad.)
2. **Budget for a product-search/match API?** (free affiliate feeds vs paid SerpAPI vs hosted CLIP.)
3. **Stripe Connect for payouts** — when to set up (real money + legal).
4. **Markets order** — IL-first networks, then global.

## Tomorrow's agent plan (dispatch)
- **Steve (CTO):** design the product-resolution service + matching pipeline (§2–3) — architecture doc + stub endpoint.
- **Oren:** MCP/integration plan for the chosen network (§6); wire `affiliate_url()` to a real deep-link builder.
- **CFO + Ayalon:** credit-economics model + which networks/markets first (§1, §4).
- **Sam:** `/api/resolve-product` stub returning exact|similar|archive, behind the existing buy flow.
- Demo stays simulated where a real key/contract isn't in place — but the *architecture is real* and the "how we get there" is documented here for the investor.
