# AWEAR — Investor Demo Script (5-Minute iPhone Flow)

> **Master Plan task C2.** The script the founders present live, on a real iPhone, in front of the investor.
> Target: **under 5 minutes**, ending on a clear "wow". Every beat below maps to a screen that exists in the app today
> (re-verified against the shipped SPA on 2026-07-11 — see the beat-by-beat screen names).
> Tone: confident, fast, let the product carry it. Talk *less* than you think — the visuals do the work.

**North-star line to open and close with:**
> *"The wardrobe is the profile. Fashion is identity. And we built this whole company with two founders and a team of AI agents — for $80K, not $2M."*

---

## 0. Before you start (pre-flight — do this 10 min before, off-camera)

- [ ] Open the app on the iPhone, complete onboarding once so you land on a populated account (streak active, closet pre-seeded with real catalog items).
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

> 💡 *Enhanced future version (backend endpoint `/api/generate-garment` exists; awaiting frontend wiring): each confirmed item could show a clean studio-quality photo generated from the scan — not a stock image, the actual garment extracted from her photo. For the current demo, items use catalog images via `search_query`. Mention this if you want to preview the roadmap.*
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

---

## 6. Buy in-app → it lands in the closet (3:25 → 3:55) — **WOW #3**

**From the item sheet, tap Buy → confirm the (simulated) checkout.**

**Say:**
> "In-app checkout. No redirect, no leaving the app. Behind this is an affiliate network on day one — 5 to 15% commission, zero inventory, zero logistics."

**The confirmation says "added to your closet" — tap Profile and show the just-bought item on the shelf.**

> "And here's the loop closing: she bought it, and it's *already* in her closet — clean catalog image and all. Scan, style, shop, own. That's the core loop."

---

## 7. Creator earns — the Wallet (3:55 → 4:25) — **WOW #4**

**Tap:** Home → **Wallet** (quick action) — the **Creator Wallet** screen.

**Say:**
> "Every purchase credited to the creator whose look drove it. Append-only ledger, idempotent, real backend. The creator sees their balance and earnings grow. *This* is why people bring their audience to us instead of just tagging a link."

Point at the balance + earnings history. (You may have already flashed the "@user earns a creator credit on this purchase" line during checkout — call back to it.)

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

---

*C2 — owner: CMO + Ayalon. Status: re-verified 2026-07-21 (10/11 DoD items confirmed live; HITL confirm screen verified shipped in `f4fe9a1` and added as explicit beat-2 step; garment-image generation backend exists but frontend not yet wired — noted as optional future upgrade). Do a timed dry-run twice before the meeting and lock the wording you're comfortable with. Source of truth for the flow: this file + [MASTER_PLAN.md](../.claude/master/MASTER_PLAN.md) §Track C + [PRODUCT_VISION.md](PRODUCT_VISION.md) §ה-WOW.*
