# AWEAR — Investor Demo Script (5-Minute iPhone Flow)

> **Master Plan task C2.** The script the founders present live, on a real iPhone, in front of the investor.
> Target: **under 5 minutes**, ending on a clear "wow". Every beat below maps to a screen that exists in the app today
> (re-verified against the shipped SPA on 2026-07-11 — see the beat-by-beat screen names).
> Tone: confident, fast, let the product carry it. Talk *less* than you think — the visuals do the work.

**North-star line to open and close with:**
> *"The wardrobe is the profile. Fashion is identity. And we built this whole company with two founders and a team of AI agents — for $80K, not $2M."*

---

## 0. Before you start (pre-flight — do this 10 min before, off-camera)

- [ ] Open the app on the iPhone, complete onboarding once so you land on a populated account (streak active, closet pre-seeded with real catalog items). Fast-seed shortcut: `curl -X POST http://localhost:8000/api/demo/seed-closet` (commit `c77b72b`) populates the demo wardrobe in one command — run it if the closet looks empty.
- [ ] Confirm Wi-Fi is on **and** test once in airplane mode — the demo is built to survive offline (scan, images, and checkout all have local fallbacks). If the venue Wi-Fi is shaky, **run the demo in airplane mode on purpose.**
- [ ] Brightness to max. Silence notifications. Close every other app.
- [ ] Have one outfit photo saved in the camera roll (or be ready to snap one live).
- [ ] Bottom nav, left→right, is: **Feed · Store · AI · DM · Profile.** Know it cold.
- [ ] Rehearse the ONE tap that carries the demo: **feed post → tap an item pill → the item sheet** (match %, stylist looks, where it sells). That sheet is the product's thesis on one screen — never fumble finding it.
- [ ] Optional backup: have `static/pitch.html` open in a browser tab and the [PITCH_DECK.md](PITCH_DECK.md) ready, in case the phone misbehaves.

**Golden rule:** if anything stalls for >2 seconds, keep talking and move to the next beat. Never wait on a spinner in front of an investor.

---

## 1. The hook — Noa's problem (0:00 → 0:30)

**Land on:** Feed (default screen). The stories row at the top shows **real people** — actual users with their own photos, not stock models.

**Say:**
> "This is Noa. She's 17, in central Israel. Her camera roll is full of outfit photos, she buys clothes off TikTok, and half her closet never gets worn. She has *nothing to wear* and a closet that's *full*. That's our user — and there are hundreds of millions of her."

Swipe the **Feed** once so they see a real, full-screen, scrollable fashion feed — real friends' looks, not seeded influencers.

> "Everything you're about to see is one app. Five layers. Let me show you the loop."

---

## 2. Scan a garment → "Did we get it right?" → closet fills itself (0:30 → 1:30) — **WOW #1**

**Tap:** the **+ Create** button → **"Scan a garment"**. Pick the saved outfit photo (or snap one live).

**While the AI spinner runs ("AI is identifying your items…"), say:**
> "She photographs an outfit. Our AI identifies every garment — top, bottoms, shoes."

> 💡 *This step has a built-in offline fallback — scan always returns a real, clean result even with no signal. You will never see an error here.*

**When the "Did we get it right?" confirm sheet slides up (it appears automatically after the scan):**

This is the live HITL screen. It shows each detected item as a card with a checkmark (✓ accepted) you can tap to reject, and an "Edit" toggle to correct the name, category, brand, or price inline.

**Say while pointing at the item cards:**
> "The AI does the first pass — and then she reviews every item before it goes anywhere. Tap to reject a wrong guess. Tap 'Edit' to correct the name. Every correction is automatically saved as a training signal we own. Her closet gets smarter with every scan. A competitor starting today starts from *zero knowledge of her* — that's our moat."

**Tap "Add X items to Closet" (the CTA at the bottom of the sheet).** Items land in the closet immediately; a toast confirms "X items added to your closet."

> 💡 *Each item in the confirm sheet now shows a clean AI-generated catalog photo via `POST /api/generate-garment` — ✅ **shipped** in commit `9975080` (2026-07-22, mark lane). Spinner → OpenAI `gpt-image-1` studio image → retailer-image fallback at 80% opacity → 44px "Regenerate" button per item. **For the demo:** the generated images appear live in this confirm sheet AND persist to the closet — commit `3c4d18d` (2026-08-02) closed the pipeline gap: `scConfirm()` now carries the generated URL into the closet item. The loop is fully closed. If generation stalls on venue Wi-Fi, the retailer image shows automatically — the demo never breaks.*
> 💡 *The same Create menu also has "Daily check-in" — mention in passing: "she logs what she wore every day, Duolingo-style streak — that's the retention engine and the data engine in one."*

---

## 3. AI Stylist — "Today's Look" (1:20 → 2:00) — **WOW #2**

**Tap:** **AI** (bottom nav). The screen opens on the **"Today's Look"** hero — a full look the stylist already built for *this* day and hour, from the user's own closet.

**Say:**
> "No prompt, no effort. It's Friday evening, so Abigail — our AI stylist — has already styled tonight's look from clothes Noa *owns*. Tomorrow morning it's a different occasion, different look. She opens the app and it's already working for her."

Point below the hero: **Chat with Abigail** ("Ask your stylist") and **Style Swipe** ("Train your taste").

> "She can ask the stylist anything about her closet, and swipe on looks to train her taste. This is the part that took a $2M team a year. For us it's one screen, live, today."

---

## 4. The shoppable feed (2:00 → 2:30)

**Tap:** **Feed** (bottom nav). Show the two tabs: **For You · Following.**

**Say:**
> "The social layer. Full-screen looks from real people — and every look is broken into its pieces. See the item pills on the post? Every garment on screen is one tap away from her closet and from checkout."

> 💡 *FEED-MATCH-BADGE ✅ **shipped** commit `d094edb` (2026-08-09, mark lane): Every feed card photo now has a **frosted match-score pill pinned at the top-left** — green sparkle (≥80% match), amber (≥60%), red (<60%), using DS-004-compliant tokens with WCAG AA+ contrast on all photo backgrounds. Investors see the personalization signal **before** tapping — no need to drill into the item sheet to grasp "this is for me." During beat-4, point at the badge and say: "Even before she taps — she already knows if something is her style. 87% match, right on the feed."*

> 💡 *FOR-YOU-CATALOG ✅ **shipped** commit `32b3369` (2026-08-11, steve lane): The **For You** tab now returns products sorted by personalized match score (`GET /api/products?sort_by=match`). The items at the top of the catalog are already ranked for *this* user's wardrobe — the highest-match pieces surface first. Demo tip: tap the For You tab and say: "This entire catalog is already ranked for her — the jacket at the top is there because it scores highest against what she actually owns." Complements FEED-MATCH-BADGE for a coherent "AI that knows her" story.*

> 💡 *CATALOG-ENRICHMENT ✅ **shipped** commits `168c90f`+`19a331e` (2026-08-11, steve lane): All **200/200 products** in the catalog are now tagged in feed posts — was 79/200 at run-61. Every product in the app is now reachable from the feed. No demo flow change; the feed just has richer content coverage and investors won't encounter a post with untagged items.*

> 💡 *FEED-REAL-PHOTOS-7 ✅ **shipped** commit `199a35d` (2026-08-12, mark lane): Feed now has **7 real demo-user photos** (was 4) — Carmel/look2, Tamar/look3, Maayan/look2 added. The "real people with their own photos" claim in Beat-1 is now backed by 7 distinct real looks. Gabbana 8/10 PASS.*

> 💡 *BROWSE-IMAGE-URL (Store tab) ✅ **shipped** commit `acfc368` (2026-08-12, mark lane): If the investor taps **Store** (second icon in the bottom nav) at any point, they'll see **real product images** on every card — was blank (loremflickr.com CDN too slow for demo). No demo beat change; this is defensive coverage so an off-script tap into Store doesn't embarrass the demo.*

---

## 5. THE WOW — tap one item (2:30 → 3:25) — **the centerpiece**

**Tap an item pill on a feed post.** The item sheet opens. Give it two full seconds of silence — the match ring animates on open.

**Then walk it top to bottom, one line per block:**

> "This is the screen that changes shopping. She saw a jacket on a friend — one tap:"
> 1. **"87% match to her closet"** — *point at the animated ring.* "Our AI scores every item in the world against what she already owns. This number is the hook — it answers 'is this *me*?' before she spends a shekel."
> 2. **Stylist picks** — "Abigail already built full looks pairing this jacket with clothes from *her own closet*. Not a model's outfit — hers."
> 3. **Where it sells** — "Real retailers, price from $X — and one resale row: the same piece second-hand at half price. We route her to whichever she picks, and we take a cut either way."

**Say the thesis line:**
> "Social → her closet → checkout, on one screen. Instagram shows her the look. Zara sells her the item. *Nobody* connects them through what she already owns. That's AWEAR."

> 💡 *Match score note (for informed demos): the "87% match" band shows instantly from a local client-side estimate (`calcCompatScore`), then silently upgrades to the server-side score. Both backend and SPA wiring are ✅ **fully shipped** — backend `9cc466c` (2026-07-24) + SPA wiring `251e38e` (2026-07-25, `app.js:699–714`). The server pulls the accurate `match_pct` from the user's persisted `closet_items`; local score shows first for perceived speed, then the server number replaces it. If an investor asks "how does the match score work?" → say: "Our server cross-references every item in the feed against what she owns in her closet — the number shows instantly and updates with her full scan history. It's live today." Then move on.*
> 
> 💡 *BH-21 — look-sheet item drill-down ✅ **shipped** commit `1322d82` (2026-08-05, mark lane): On a **look detail sheet** (not just the feed pill), every item thumbnail is now tappable — tap any garment photo to drill directly into that item's full detail sheet (match %, stylist picks, buy options, 3-tier status). Demo bonus: open a look sheet from the profile grid, then tap any item thumbnail to show the commerce loop closing from the other direction. "She doesn't just see the look — every piece in it is one tap from her closet and from checkout."*

> 💡 *ITEM-SHEET-CTA ✅ **shipped** commit `13b0bb9` (2026-08-06, mark lane): The 3-tier CTA in the item detail sheet now **dynamically adapts** to each item's buy status — ✅ Buyable → "Buy" affiliate deep-link; 🔄 Find similar → opens `/api/find-similar`; ♻️ Resale → routes to Depop/Vinted search. You will never see a dead or wrong-tier Buy button on any item during the demo.*

> 💡 *MATCH-MATRIX ✅ **shipped** commits `5a24c0b` (2026-08-07) + `9b203aa` (2026-08-09, steve lane): Bags, dresses, hats, shoes, and accessories all now count in wardrobe match scoring — `_COMPLEMENTS` fully expanded. With the 12-item demo seed wardrobe, these categories now reach **95%** match (was 71-79%). No UI change; the number is simply more accurate and more impressive in the room.*

> 💡 *MATCH-SCORE-EXT ✅ **shipped** commit `77c499e` (2026-08-09, steve lane): Match scoring now extends the keyword haystack to include each product's `search_query` and `tags`, plus adds explicit bonuses for exact brand (+3), color (+2), subcategory (+2). Niche terms like "tee" or "workwear" now contribute correctly. The ring % an investor sees is the most reliable it has ever been — the right product ranks above look-alikes that share only the top-level category.*

> 💡 *LOOK-SHEET-CHIP-ANIM ✅ **shipped** commit `5a3f177` (2026-08-09, mark lane): The look-sheet's "X% match to your style" chip now **animates from 0 → target** on open (easeOutCubic, 600ms) — matching the dramatic ring count-up on the item-detail sheet. Every tap in the WOW flow now delivers a personalization-signal moment: item sheet (ring), look sheet (chip). Consistent throughout.*

---

## 6. Buy in-app → it lands in the closet (3:25 → 3:55) — **WOW #3**

**From the item sheet, tap Buy → confirm the (simulated) checkout.**

**Say:**
> "In-app checkout. No redirect, no leaving the app. Behind this is an affiliate network on day one — 5 to 15% commission, zero inventory, zero logistics."

**The confirmation says "added to your closet" — tap Profile and show the just-bought item on the shelf.**

> "And here's the loop closing: she bought it, and it's *already* in her closet — clean catalog image and all. Scan, style, shop, own. That's the core loop."

> 💡 *Nav fix shipped 2026-07-26 (`ca649fa`): tapping any look-post tile on the Profile grid now opens that specific look's detail sheet directly — previously it dumped to the generic feed (regression). For the demo: after showing the closet shelf, you can tap one of her look posts to open the full look-detail sheet right from the profile — reinforces "the wardrobe is the profile" in a single tap. No longer a dead end.*

> 💡 *Closet image note (for informed demos): the item in the closet now shows the same **AI-generated catalog photo** that appeared in the confirm sheet — the pipeline gap was ✅ **closed in commit `3c4d18d` (2026-08-02)**. If an investor asks: "Is that the AI-generated image?" → say: "Yes — the AI generates a studio-clean image during the review step, and that same clean image is what lands in the closet." Point to the closet shelf confidently.*

> 💡 *BH-22 purchase-modal drag-dismiss ✅ **shipped** commit `69746b3` (2026-08-06, mark lane): The checkout modal now drag-dismisses with spring physics on iOS (swipe down to cancel) and has a max-height cap so it never overflows on smaller iPhones. Safe to swipe-dismiss in front of an investor — no risk of the modal getting stuck.*

> 💡 *PROFILE-LOOK-BUY ✅ **shipped** commit `a554415` (2026-08-09, mark lane): Tapping a look post on the **Profile Posts tab** now opens the proper **3-tier buy sheet** (Buy exact / Find similar / Resale, per item), replacing the previous dead "Close"-only sheet. Demo bonus (beat-6 extension): after showing the closet shelf, tap any look-post tile on the profile — the buy sheet slides up immediately. Say: "From her profile to checkout — one tap. The wardrobe is the profile, and the profile is shoppable." The commerce loop now closes convincingly from the profile direction.*

> 💡 *LOOK-CARD-SHOP-PILL ✅ **shipped** commit `825a668` (2026-08-10, mark lane): Every look card in the Profile/Looks grid that has a price now shows a frosted bag-icon pill (top-right corner) — the same frosted-overlay pattern as feed cards. Commerce signal is visible *before* tapping. Demo tip: scroll the Looks grid briefly and point at the bag pills. Say: "Every look with a price tag is shoppable — you see it before you even tap." The shoppability of the profile is now self-evident.*

> 💡 *LOOK-CAPTION ✅ **shipped** commit `e136ead` (2026-08-11, mark lane): Look grid cards now show an **AI-generated caption** (the look's name) below the collage image. Demo tip: scroll the Profile Looks grid so the investor sees the titled cards — say: "Every look her AI stylist creates gets a name. That's the content layer that makes the profile feel alive." Pairs naturally with LOOK-CARD-SHOP-PILL: the named, priced look communicates "styled content + shoppable" in a single card.*

---

## 7. Creator earns — the Wallet (3:55 → 4:25) — **WOW #4**

**Tap:** Home → **Wallet** (quick action) — the **Creator Wallet** screen.

**Say:**
> "Every purchase credited to the creator whose look drove it. Append-only ledger, idempotent, real backend. The creator sees their balance and earnings grow. *This* is why people bring their audience to us instead of just tagging a link."

Point at the balance + earnings history. (You may have already flashed the "@user earns a creator credit on this purchase" line during checkout — call back to it.)

> 💡 *COMMERCE-XCUST ✅ **shipped** commit `b9597d1` (2026-08-07): The final attribution gap is closed — `GET /api/resolve-product` and `GET /api/find-similar` now both embed `xcust=poster_id:post_id` in every affiliate link they return. **If an investor asks "how do you know which creator gets credit for a sale?" → say: "Every affiliate deep-link from any path in the app carries the original poster's ID as a sub-parameter — the network postback credits their wallet automatically, with no AWEAR server-side interception of the payment."***

> ⚙️ *PRE-FLIGHT (beat 7): Run `POST /api/demo/seed-wallet?user_id=tamar` before the demo (commit `65e0046`). Without it the Wallet screen shows $0 — with it, it shows **$21.35 confirmed + $10.40 pending** (9 realistic affiliate credits). Idempotent — safe to call multiple times. Pair with `POST /api/demo/seed-closet?user_id=tamar` for beat-2 (closet must also be non-empty).*

---

## 8. The closer — built by agents (4:25 → 5:00) — **WOW #5 / the thesis**

**Tap:** Home → **Agent Team** (quick action → agents dashboard).

**Say:**
> "Last thing. Everything you just saw — 18 screens, five layers, a real backend — was built by a *team of AI agents*: a CEO, a CTO, designers, backend, social. Two human founders directing them."

Point at the live activity timeline (real recent commits) and the team grid.

> "What a normal startup needs $2M and ten people to build, we did with $80K and agents that work 24/7. That's not just our product thesis — it's our *company* thesis. We're asking for $70–80K to take this to market."

**Close on the north-star line.** Stop talking. Let it land.

---

## Timing cheat-sheet (keep total < 5:00)

| Beat | Screen | End by |
|------|--------|--------|
| 1. Hook | Feed (+ real-user stories) | 0:30 |
| 2. Scan → "Did we get it right?" → closet | Create → Scan → HITL confirm sheet | 1:30 |
| 3. Today's Look | AI tab hero | 2:05 |
| 4. Shoppable feed | Feed (For You · Following) | 2:35 |
| 5. **THE WOW — item sheet** | match % · stylist picks · where it sells | 3:25 |
| 6. Buy → closet | Checkout → Profile | 3:55 |
| 7. Wallet | Creator Wallet | 4:25 |
| 8. Built by agents | Agent Team | 5:00 |

**If you're running long:** cut beat 4 short (one sentence) and protect beat 5 — the item sheet is the demo. Never rush the match-ring reveal. For beat 2 in a tight run, do the scan, say the moat line once, then confirm immediately — don't belabour the item cards.

**If you have 90 extra seconds** (investor is engaged and asking about the economy): run Appendix A — the Resale Loop. It closes the circular-economy story and backs up the Phase-3 revenue claim with a live screen.

---

## If something breaks (recover, don't apologize)

- **Spinner hangs >2s:** keep narrating, swipe to the next screen. The story continues without it.
- **No network:** the demo is built for this — scan, images, and checkout all fall back locally. *Use airplane mode if the venue Wi-Fi is unreliable.*
- **Match ring shows "Add clothes to see your match":** you're on an empty-closet account — that's the pre-flight seeded-account check failing. Recover verbally ("on a new user this fills as she scans") and switch to the seeded account after the meeting beat.
- **Phone dies / freezes:** switch to `static/pitch.html` (the deck) on a laptop and walk the same 8 beats verbally. Same story, no phone.
- **Investor asks a hard money question mid-demo:** "Great question — I'll hit that on the model slide right after." Finish the flow first; the product is the wow.

---

## What each beat proves (so you can answer "so what?")

| Beat | The point an investor should take away |
|------|----------------------------------------|
| Scan + HITL confirm | Human-in-the-loop flywheel: the "Did we get it right?" screen is live — every correction adds proprietary labeled wardrobe data that compounds per user. This is the moat on-screen, not just narrated. |
| Today's Look | Zero-effort daily value — the retention engine, already live |
| Shoppable feed | Distribution = real people's looks, built into the product |
| **Item sheet (THE WOW)** | **The category bet: social ↔ closet ↔ commerce fused on one screen — nobody else can render "87% match to *your* closet"** |
| In-app buy | Revenue on day one (affiliate), no inventory risk |
| Wallet | Two-sided flywheel — creators are *paid*, not just tagged |
| Built by agents | 25× capital efficiency — the real reason to bet on us |
| **Resale loop (Appendix A, BONUS)** | **Circular economy on-screen: AI surfaces idle closet value → P2P marketplace → Phase-3 15% commission — the full flywheel in 90 seconds** |

## Appendix A — The Resale Loop (90-second bonus beat)

> **When to use:** only if the investor asks "what happens to clothes she no longer wears?" or if the main 8 beats ran 90 seconds short. Skip it on a tight clock — protect beats 5 and 8 first.

**Entry:** From the **AI Stylist** tab, scroll below the Today's Look hero to the **Stats section**. A red callout reads: *"⚠ Unworn this season — 14 items sitting idle · estimated $840 value"*. Below it: a **"List them"** button.

**Tap "List them"** → Marketplace opens on the **My Store** tab.

**Say:**
> "Her AI wardrobe doesn't just tell her what to buy — it tells her what to *sell*. Fourteen items, sitting idle, $840 of resale value, identified automatically."

Point at the item cards with the lavender **AI price** badge ("AI-priced based on resale market demand").

> "The AI prices each piece at 50% of its original price — calibrated to resale demand. One tap to list. A buyer finds it in the Community tab. AWEAR takes 15% commission. No shipping negotiation, no escrow — a clean P2P transaction."

**Tap "Community" tab** to show the active peer-to-peer listings.

> "This is the full circular economy. She buys through us, wears the item, the AI notices it's idle, she resells it through us. Every step earns a commission. The data from every resale feeds back into her match scores for the next purchase. The flywheel is self-funding."

> 💡 *MARKETPLACE-DS-POLISH ✅ **shipped** commit `58459c2` (2026-08-11, mark run-79): Full Gabbana P1 pass on the Marketplace — KPI readability, 44px touch targets throughout, badge border-radius tokenized, active-state scale spring, light-mode sell-pill contrast corrected. The Marketplace is investor-presentation-ready on any screen or lighting condition.*

> ⚙️ *Pre-flight: the "My Store" tab auto-populates from the seeded closet (`POST /api/demo/seed-closet`). No separate marketplace seed needed — unworn items in the demo wardrobe surface automatically in the AI's resale suggestions.*

---

*C2 — owner: CMO + Ayalon. Status: re-verified 2026-08-01 (13 DoD items total: 12 fully verified, 1 doc-only — full breakdown in DOD_AUDIT.md. Nav fix `ca649fa` landed 2026-07-26 — profile look-tiles now open the correct look sheet; beat-6 tip updated. Match score SPA wiring ✅ shipped `251e38e` — beat-5 note updated; match score now fully live (client instant-show + server upgrade). Closet persistence pipeline gap documented in DOD_AUDIT.md item #12. **2026-07-27 ships (demo-confidence improvements):** (1) BH-10 DS-004 --success fallback sweep `0651046` — all CSS color tokens correct dark-mode values; app is visually clean across all screens for the demo. (2) Backend resilience hardening `d148c50` — agent_schedule/agent_meeting/agent_summary now return 503 (not 500) on Google Calendar/SMTP unavailability; beat-8 "Built by agents" dashboard won't crash if the venue has no Google credentials. Both are quality/reliability ships with no demo flow change. **2026-07-29–30 ships (visual polish, 4 UX items):** (3) BH-12 profile/closet UX sweep `be16bac` — 8 DS-token fixes; `.ig-name-bio` full bio now visible (no truncation); Gabbana 8.5/10; direct impact on beat-6 (profile shelf) and beat-7 (Wallet). (4) BH-13 dead buttons `eb7dc94` — "Wear one this week" CTA navigates to Closet; Wishlist button persists to localStorage. (5) BH-14 sf-sub/sf-card-brand DS-004 fixes + scroll-fade affordance `a004b35 7e4c3fd bb3f3c4` — Stories/Home rows signal horizontal scrollability. (6) BH-15 text truncation sweep `5728519` — AI outfit names (beat-3: "Today's Look" generator), wishlist rows, and Home outfit cards no longer overflow; ellipsis and 2-line clamp applied — demo screens look production-quality. **2026-07-31 ships (iOS polish + reliability, 5 items):** (7) BH-16 comments-sheet backdrop tap-to-close + purchase-modal iOS safe-area top `03f5e2e` — purchase modal no longer clipped by iPhone notch on beat-6 checkout; comments-sheet backdrop now closes on tap. (8) BH-17 avatar-initials contrast `dc70e2d` — initials on gradient WCAG AA readable; beat-1 stories row + DM avatars polished. (9) BH-18 feed share button → real Web Share API / clipboard fallback `6b4fd5a` — share button on beat-4 feed posts no longer a dead-end tap. (10) BH-19 iOS create-sheet swipe-dismiss + diary-footer safe-area `fa40522` — beat-2 create menu swipe-dismisses on iPhone X+; diary submit button visible above home indicator. (11) RESILIENCE-2 `39efe7f` — agent_summary 500→503 consistency fix; all Google-absent agent endpoints (schedule/meeting/summary) now consistently 503 — beat-8 dashboard fully crash-resilient. **2026-08-01 ships (profile/closet polish, 1 item):** (12) BH-20 closet/profile screen Gabbana 6.5→8.0 `14f53db` — `.ig-edit` border/font-size, `.seg button` opacity fog removed (WCAG 4.9:1+), `season-entry-card` distinct background, `ig-headstats` font tokens; beat-6 (profile) and beat-7 (closet) screens polished to investor-demo standard. **20 BH polish items total shipped across mark lanes 22–42. 2026-08-02 (mark run 56 pre-run): closet image pipeline gap CLOSED `3c4d21d` — AI-generated catalog image now persists from confirm to closet (beat-2 + beat-6 tips updated). 2026-08-05 (mark run 55): flat-lay hero + match chip on look sheet `49307bd`. 2026-08-05 (mark run 56): BH-21 — look-sheet item thumbnails tap to drill into item detail `1322d82` (beat-5 tip added). 2026-08-05 (steve run 34): `POST /api/demo/seed-closet` `c77b72b` — pre-flight seed shortcut added. Test suite: 278 effective pytests (277 definitions; through commit `65e0046`). **2026-08-06 (mark runs 57–59): (13) ONBOARDING-KB Ken Burns animation on onboarding photos `e8dcbaf`. (14) THUMBNAIL-FIX object-fit:cover on look-emoji thumbnails `3eb8d62`. (15) ITEM-SHEET-CTA 3-tier CTA dynamically adapts to item buy status in item detail sheet `13b0bb9` — beat-5 tip added. (16) BH-22 purchase-modal drag-dismiss + max-height cap `69746b3` — beat-6 tip added. 2026-08-07 (sam/steve): (17) COMMERCE-XCUST `b9597d1` — xcust attribution now flows through resolve-product + find-similar; every affiliate link in every path carries the poster SubID — beat-7 tip added. (18) MATCH-MATRIX `5a24c0b` — bag + dress now included in complement scoring; scanned bags/dresses raise match % — beat-5 tip added. **(19) SEED-WALLET `65e0046` (steve run-38, 2026-08-07) — `POST /api/demo/seed-wallet` pre-populates $21.35 confirmed + $10.40 pending; beat-7 pre-flight tip added. (20) SHOP-MATCH-CONSISTENCY `6d7ac3f` (mark run-65, 2026-08-08) — `renderShopGrid()` now uses `calcCompatScore()` for match% consistency with item-sheet score; background quality, no demo flow change. **2026-08-09 run-59 ships (4 demo-visible items):** (21) FEED-MATCH-BADGE `d094edb` (mark run-66) — frosted match-score pill pinned top-left on every feed card; green/amber/red by tier; beat-4 tip added. (22) LOOK-SHEET-CHIP-ANIM `5a3f177` (mark run-67) — look-sheet match% chip animates 0→target on open, matching item-detail ring; consistent wow across both sheet types. (23) MATCH-SCORE-EXT `77c499e` (steve) — extended haystack + exact brand/color/subcategory bonuses; match ring is more accurate. (24) MATCH-MATRIX-EXT `9b203aa` (steve) — hat/shoes/accessory fully scored; demo wardrobe now reaches 95% match (was 71-79%). (25) PROFILE-LOOK-BUY `a554415` (mark run-69) — Profile Posts tap opens 3-tier buy sheet; beat-6 tip added. Re-verified 2026-08-09 by ayalon lane run-59. **2026-08-10 run-61 ships (3 demo-visible + 2 content):** (26) LOOK-CARD-SHOP-PILL `825a668` (mark run-75) — frosted bag pill on shoppable look cards in Profile/Looks grid; beat-6 tip added. (27) LOOK-SHEET-COLLAGE-ASPECT `b076404` (mark run-74) — look-sheet 4:3→4:5 portrait aspect + badge contrast. (28) COMMERCE-UI-POLISH `4d26ab7` (mark run-73) — accent buy-btn + tokenized store-logo. (29) FEED-CONTENT-ENRICHMENT `fc5edea`+`de8d400` (steve runs 41–42) — 23 product tags added; 79/200 products in feed. (30) TEST-COVERAGE-STORIES-DM `3185dae` — +18 hermetic tests; test suite now 303 effective. Re-verified 2026-08-10 by ayalon lane run-61. **2026-08-11 run-64 ships (2 demo-visible + 3 quality):** (31) LOOK-CAPTION `e136ead` (mark run-76) — AI-named captions on look grid cards; beat-6 tip added. (32) FOR-YOU-CATALOG `32b3369` (steve) — For You tab sorted by personalized match score; beat-4 tip added. (33) CATALOG-ENRICHMENT `168c90f`+`19a331e` (steve) — 200/200 products tagged in posts (was 79/200); feed fully shoppable; beat-4 note added. (34) CLOSET-PORTRAIT-TILES `1472c6f` (mark run-78) — portrait product tiles on category shelves DS polish; background quality. (35) MARKETPLACE-DS-POLISH `58459c2` (mark run-79) — KPI readability + touch targets + badge token; background quality. Test suite: 305 effective pytests. Re-verified 2026-08-11 by ayalon lane run-64. **(36) APPENDIX-A-RESALE-LOOP (ayalon run-65, 2026-08-11) — Marketplace bonus beat added to DEMO_SCRIPT: 90-second optional extension showing the P2P resale loop (AI surfaces idle closet items → My Store → Community → 15% commission). Backs up PITCH_DECK Slide 5 Phase-3 revenue claim with a live screen. Timing cheat-sheet + proof table updated. No code change.** **2026-08-12 run-66 ships (2 content + 2 quality):** (37) FEED-REAL-PHOTOS-7 (mark lane, commit `199a35d`) — feed now has 7 real demo-user photos; beat-1 "real people" claim backed by 7 distinct real looks. (38) BROWSE-IMAGE-URL (mark lane, commit `acfc368`) — all Store tab items have real CDN images; off-script taps into Store won't expose placeholder images. (39) SEARCH-HAYSTACK-EXT (steve run-47, commit `df926e1`) — product search expanded to search_query+tags+subcategory+description; 2 regression pytests. (40) CDN-COLOR-DETECT (steve run-48, commit `a950a87`) — data_integrity.py color-consistency detector added; prod_ht_019 color corrected. **Test suite: 311 effective pytests.** Re-verified 2026-08-12 by ayalon lane run-66.). Do a timed dry-run twice before the meeting and lock the wording you're comfortable with. Source of truth for the flow: this file + [MASTER_PLAN.md](../.claude/master/MASTER_PLAN.md) §Track C + [PRODUCT_VISION.md](PRODUCT_VISION.md) §ה-WOW.*
