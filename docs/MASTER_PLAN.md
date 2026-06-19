# AWEAR — Master Plan to Investor-Ready (Native iOS, all 5 layers)

> Approved by founders in a Plan-Mode session. Single source of truth for the next 2-4 weeks. Built agentically (agents execute, founders approve at gates).

## Context
Investor meeting (~2-4 weeks out, Carmel's uncle, $70-80K raise). Goal: the whole app **investor-ready as a native iOS app**, **global/English with Israel as first market**, **all 5 layers polished**, built **agentically**.

Today's reality: mature **web SPA** (`static/index.html`, 18 screens) + FastAPI backend (`app.py`, real Claude + SQLite). Native RN (`mobile/`) is early. Product images broken (Pollinations went paid). No pitch deck.

## Locked decisions (founders)
1. **Platform:** Native iOS by **wrapping the web SPA in Capacitor** (real iOS app for Simulator/TestFlight, reuses everything).
2. **Market:** Global, English-first, **Israel as beachhead**.
3. **Scope:** All **5 layers** polished (Gabbana 8+).
4. **Timeline:** 2-4 weeks.

## Product vision — source of truth
**One-liner:** *Your closet IS your social profile.*

**Daily hook:** **privately document today's outfit** (a daily log, saved only to you in a dedicated area) → wardrobe habit + Duolingo-style streaks. This private daily tracking is also the **data engine** behind usage stats and "what to sell" suggestions.

**Intake / scanning — two ways:** (a) **full mirror/outfit selfie** → AI breaks it into items and the **user refines/pinpoints the exact product**; (b) **photo of a single item**. Either way the AI matches each piece to a clean catalog image.

**Upload types (visibility):** **public post** · **friends-only post** · **private daily documentation** (outfit diary, only you). Posts feed the social feed; the private diary feeds stats + resale suggestions.

**Core loop:** scan your clothes → scroll the feed (For You + Following, TikTok-style) → AI stylist proactively suggests looks → influencers (growth channel) post shoppable looks → **buy in-app via dropshipping** → item lands in your closet → **the creator whose post drove the purchase earns credits**.

**Creator credits / wallet:** a purchase **through someone's post** earns that user **credits**, **withdrawable to a bank account above a threshold**. Turns every user into a potential earner + fuels organic growth. Funded by the commission AWEAR earns on each referred sale, shared with the creator — via **affiliate networks day-1, deeper fashion-retailer partnerships at scale**. Demo: simulated wallet.

**The 5 layers:**
- **L1 — Closet = Profile.** Sections: **Looks** (posts) · **item shelves by category** (shoes/tops/bottoms/accessories) · **marketplace area**. Items from: scanned clothes, uploaded posts, in-app purchases, saved looks/wishlist. Every item shown as a **clean retailer catalog image the AI matched** (not emoji, not raw photo) — the visual north star.
- **L2 — Commerce.** **In-app purchase via dropshipping** (never leave the app; simulated in demo). NOT a redirect.
- **L3 — Resale.** A **feature inside the closet**, not a pillar. Smart closet **suggests what to sell** based on actual usage (from the private daily tracking) → AI price → sell.
- **L4 — AI Stylist (richest layer):** (a) proactive recs by **event** (date/coffee/interview) + **season**; (b) **chat** (ask for looks + closet Q&A); (c) **stats + daily/weekly/monthly summaries**; (d) **Tinder-style swipe** to learn taste; (e) **Duolingo-style gamification** (streaks/goals/levels); (f) recommends **both** from-closet **and** new-to-buy.
- **L5 — Social feed.** TikTok-style, **For You + Following**, shoppable looks, influencers as growth channel.

**Added ideas (to confirm):** outfit calendar/planner, saved-looks board, streak rewards, seasonal capsule.

## Three tracks

### Track A — Product / Technical
- **A1.** Capacitor iOS shell — run in Simulator + TestFlight; camera via `@capacitor/camera`. Owner: **Steve + Oren**.
- **A2.** Clean product-image system — scan → AI match → clean catalog image; premium placeholder fallback. Owner: **Dolce + Netta + Sam**, Gabbana gate.
- **A3.** In-app dropshipping checkout (replace retailer redirect): product page → bag → simulated checkout → item added to closet. Owner: **Sam + Dolce**.
- **A4.** Polish 5 layers to 8+ (focus: **stylist build-out**). Owner: **Ayalon dispatches Dolce/Sam/Shira**.
- **A5.** English completeness + he toggle. Owner: **Maayan's session**.
- **A6.** Live-demo reliability (fallbacks, no broken images). Owner: **Steve**.
- **A7.** Creator credits / wallet — credit the poster on a referred buy; Wallet screen (balance + history + withdraw>threshold, simulated). Backend: `credits` + `orders` tables. Owner: **Sam + Shira + Dolce**.

### Track B — Business
- **B1.** Update `BUSINESS_PLAN.md` → global + Israel-beachhead; in-app dropshipping + creator-credits model; USD. Owner: **Jeff + CFO + Ayalon**.
- **B2.** Creator-credit economics + partnership path (affiliate day-1 → retailer deals at scale). Owner: **Jeff + CFO**.

### Track C — Investor pitch
- **C1.** Pitch deck (missing): problem → solution (closet=profile + 5 layers) → agent-built-company thesis → market → model → traction → raise/use → demo. Owner: **CMO + Jeff**.
- **C2.** Demo script: scan → shelves as clean images → stylist suggests → feed → in-app buy → **show the live agent dashboard** as proof of "built by agents." <5 min to wow. Owner: **CMO + Ayalon**.

## Coordination (two teams on one repo)
- Coordinate via **Jeff (CEO agent)** + board-sync; enforce **worktree discipline** to avoid merge-hell.
- **Two-team split:** Maayan's session owns English + agreed track; Carmel's team owns the rest. **Pull+push frequently.**
- **Gates per change:** Gabbana (8+) → code-reviewer skill → Playwright verify → JS syntax → commit/push.

## Sequencing (2-4 weeks)
- **Week 1:** Capacitor shell (A1) · clean images (A2) · in-app checkout (A3) · deck skeleton (C1) · business-plan update (B1).
- **Week 2:** polish 5 layers to 8+ (A4, focus stylist) · demo script (C2) · deck draft.
- **Week 3:** TestFlight build · rehearsal on real iPhone · deck finalize · dry-run with a non-team person.
- **Week 4 (buffer):** fix findings · final polish.

## Verification
- Runs in iOS Simulator + real iPhone (TestFlight); all 5 layers usable; camera works.
- Closet items show clean product images, never emoji/broken. In-app buy completes → item in closet.
- Playwright 0 errors all screens; backend 200. Live dry-run hits "wow" in <5 min.

## Open decisions
1. Product-image source: curated + premium placeholder (free) vs paid vendor — budget.
2. Two-team split — via Jeff/board.
3. `mobile/` RN: deprioritize for Capacitor wrap? — Steve/Varan.
4. Added ideas (calendar, saved-looks, streak rewards, capsule) — keep/drop.
5. Creator payout: real withdrawal needs a payments provider (Stripe Connect) + affiliate sign-up; demo simulated.
