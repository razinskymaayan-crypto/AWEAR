# AWEAR — Master Plan to Investor-Ready (Native iOS, all 5 layers)

## Context
Investor meeting (~2-4 weeks out, Carmel's uncle, $70-80K raise). Goal: the whole app **investor-ready as a native iOS app**, **global/English with Israel as first market**, **all 5 layers polished**, built **agentically** (agents execute, founders approve at gates).

Today's reality: mature **web SPA** (`static/index.html`, 18 screens) + FastAPI backend (`app.py`, real Claude + SQLite). Native RN (`mobile/`) is early. Product images broken (Pollinations went paid). No pitch deck.

## Locked decisions (founder)
1. **Platform:** Native iOS by **wrapping the web SPA in Capacitor** (real iOS app for Simulator/TestFlight, reuses everything).
2. **Market:** Global, English-first, **Israel as beachhead**.
3. **Scope:** All **5 layers** polished (Gabbana 8+).
4. **Timeline:** 2-4 weeks.

## Product vision — how the founder sees it (the source of truth)
**One-liner:** *Your closet IS your social profile.* 

**Daily hook:** **privately document today's outfit** (a daily log, saved only to you in a dedicated area) → the wardrobe-building habit + Duolingo-style streaks. This private daily tracking is also the **data engine** behind usage stats and "what to sell" suggestions.

**Intake / scanning — two ways:** (a) a **full mirror/outfit selfie** → AI breaks it into items and the **user helps refine/pinpoint the exact product**; (b) a **photo of a single item**. Either way the AI matches each piece to a clean catalog image.

**Upload types (visibility):** **public post** (seen by the world) · **friends-only post** · **private daily documentation** (outfit diary, only you, dedicated area). Posts feed the social feed; the private diary feeds stats + resale suggestions.

**Core loop:** scan your clothes → scroll the feed (For You + Following, TikTok-style) → the AI stylist proactively suggests looks → influencers (a growth channel) post shoppable looks → **buy in-app via dropshipping** → the item lands in your closet → **the creator whose post drove the purchase earns credits**.

**Creator credits / wallet (monetization for users):** when a purchase is made **through someone's post**, that user earns **credits** in AWEAR. Credits are **withdrawable to a bank account above a threshold**. This is what turns every user into a potential earner and fuels organic growth (incentive to post/share). Funding: the commission AWEAR earns on each referred sale is shared with the creator — enabled by **affiliate networks day-1, and deeper fashion-retailer/network partnerships at scale**. In the demo: the wallet + credits are shown (simulated); real withdrawal/payout is the "how we get there."

**The 5 layers (refined):**
- **L1 — Closet = Profile.** Sections: **Looks** (posts) · **item shelves by category** (shoes / tops / bottoms / accessories) · **marketplace area**. Items populate from: clothes you scanned, posts you uploaded, items you bought in-app, and **saved looks / wishlist**. Every item is shown as a **clean retailer catalog image the AI matched** (not emoji, not your raw photo) — this is the visual north star.
- **L2 — Commerce (Shop-the-Look).** **In-app purchase via dropshipping** (you never leave the app; simulated in the demo). NOT a redirect to the retailer. Affiliate/dropshipping is the backend economics; the UX is an in-app checkout.
- **L3 — Resale marketplace.** A **feature/area inside the closet**, not a pillar. The **smart closet proactively suggests what to sell** based on your **actual usage** (from the private daily-documentation tracking — items you rarely wear) → list with AI-suggested price → sell.
- **L4 — AI Stylist (the richest layer).** (a) proactive recommendations by **event** (date, coffee, interview…) and **season**; (b) **chat** — ask for looks + questions about your closet; (c) **stats + daily/weekly/monthly summaries**; (d) **Tinder-style swipe** on looks to learn your taste; (e) **Duolingo-style gamification** — streaks, goals, levels; (f) recommends **both** wearing from your closet **and** new items to buy (shoppable).
- **L5 — Social feed.** TikTok-style full-screen, **For You + Following** tabs, shoppable looks, influencers as a growth channel.

**My added ideas (founder invited):** outfit **calendar/planner** ("what I wore when" → feeds the stats + cost-per-wear), **saved-looks board** (wishlist of outfits, not just items), **streak rewards** tied to daily scanning (reinforces the hook), **seasonal capsule** suggestions from the stylist. To confirm during execution.

## Three tracks

### Track A — Product / Technical
- **A1. Native iOS shell (Capacitor):** add `@capacitor/ios`, webDir → `static/`, run in Simulator + TestFlight build. Native: safe-areas, status bar, splash/icon, **camera via `@capacitor/camera`**. Owner: **Steve (CTO) + Oren**.
- **A2. Clean product-image system (visual north star + fixes "looks cheap"):** scan → AI identifies → show the **matched clean catalog image**. Mechanism: use `search_query` → curated catalog images for demo/seed items + a consistent premium placeholder fallback (light bg, 4:5). Optional Pexels/real-image proxy as v2. Owner: **Dolce + Netta + Sam**, Gabbana gate.
- **A3. Fix commerce to IN-APP dropshipping checkout** (currently redirects to retailer — must change): in-app product page → add to bag → simulated checkout → "ordered, on its way" → item added to closet. Owner: **Sam (backend) + Dolce (UI)**.
- **A4. Polish the 5 layers to Gabbana 8+:** L1 closet=profile (Looks + category shelves + marketplace area); L2 in-app buy; L3 resale feature; **L4 stylist — build out event/seasonal recs + chat + stats/summaries + swipe-to-learn + streaks/gamification**; L5 feed For You+Following. Owners: **Ayalon (product) dispatches Dolce/Sam/Shira**.
- **A5. English completeness** maintained; keep he toggle. Owner: **this session**.
- **A6. Live-demo reliability:** demo fallbacks everywhere, zero broken images, graceful offline. Owner: **Steve**.
- **A7. Creator credits / wallet:** when a buy happens through a user's post, credit the poster; a **Wallet** screen shows balance + earnings history + "withdraw above $X" (simulated payout in demo). Backend: `credits` + `orders` tables tying purchase → post → earner. Owner: **Sam (backend) + Shira (social tie-in) + Dolce (wallet UI)**.

### Track B — Business
- **B1.** Update `docs/BUSINESS_PLAN.md` → global + Israel-beachhead; reflect **in-app dropshipping + creator-credits** model (currently affiliate-first framing); USD economics. Owner: **Jeff + CFO + Ayalon**.
- **B2. Creator-credit economics + partnerships:** model the take-rate split (AWEAR commission → creator credit share), the withdrawal threshold, and the **partnership path** (affiliate networks day-1 → fashion-retailer/network deals at scale). This is a real dependency to articulate for the investor (and the "how we get there"). Owner: **Jeff + CFO**.

### Track C — Investor pitch
- **C1. Pitch deck** (missing): problem → solution (closet=profile + 5 layers) → **agent-built-company thesis** → market → model → traction plan → raise/use → demo. Owner: **CMO + Jeff**.
- **C2. Demo script:** live iPhone flow — scan a look → it lands on your shelves as clean product images → stylist suggests an outfit (event/season) → feed (For You) → buy a look in-app → **show the live agent dashboard / 3D office** as proof of "built by agents." Under ~5 min to wow. Owner: **CMO + Ayalon**.

## Agentic execution & coordination
- Owners mapped above; coordinate via **Jeff (CEO agent)** + board-sync; enforce **worktree discipline (Iron Rule #14)** to avoid merge-hell.
- **Two-team split with Carmel's team** — confirm via Jeff/board; this session owns English + agreed track; **pull+push frequently**.
- **Gates per change:** Gabbana (design 8+) → `code-reviewer` skill → Playwright verify (Iron Rule #9) → JS syntax → commit/push.

## Sequencing (2-4 weeks)
- **Week 1:** Capacitor iOS shell in Simulator (A1) · clean product-image system (A2) · in-app dropshipping checkout (A3) · deck skeleton (C1) · business-plan update (B1).
- **Week 2:** polish all 5 layers to 8+ (A4), with focus on the **stylist build-out** · demo script (C2) · deck draft.
- **Week 3:** TestFlight build · end-to-end rehearsal on a real iPhone · deck finalize · **dry-run with a non-team person**.
- **Week 4 (buffer):** fix rehearsal findings · final polish.

## Verification (end-to-end)
- Runs in **iOS Simulator + real iPhone (TestFlight)**; all 5 layers usable on-device (camera works).
- Closet items show **clean product images** (matched), never emoji/broken.
- In-app buy completes and the item appears in the closet.
- Playwright: 0 runtime errors all screens. Backend endpoints 200 (curl).
- **Live dry-run** with a non-team tester reaches "wow" in <5 min.

## Critical files
- `static/index.html` (the app, via Capacitor) · `app.py` + `schema.sql` (marketplace + **orders + credits** tables) · new `capacitor.config.ts` + `ios/` · `docs/BUSINESS_PLAN.md` · new `docs/PITCH.md`.

## Open decisions to confirm during execution
1. Product-image source: curated catalog images + premium placeholder (free) vs paid real-image vendor — **budget call**.
2. Two-team split with Carmel's team — via Jeff/board.
3. `mobile/` RN effort: deprioritize in favor of the Capacitor wrap to avoid duplicate work? — Steve/Varan.
4. My added ideas (outfit calendar, saved-looks board, streak rewards, seasonal capsule) — keep/drop.
5. **Creator payout / partnerships:** real bank withdrawal needs a payments provider (e.g. Stripe Connect) + affiliate-network sign-up; deeper fashion-retailer partnerships at scale. Demo = simulated wallet. **Budget/legal call** — articulate as "how we get there" for the investor.
