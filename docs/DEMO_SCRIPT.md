# AWEAR — Investor Demo Script (5-Minute iPhone Flow)

> **Master Plan task C2.** The script the founders present live, on a real iPhone, in front of the investor.
> Target: **under 5 minutes**, ending on a clear "wow". Every beat below maps to a screen that exists in the app today.
> Tone: confident, fast, let the product carry it. Talk *less* than you think — the visuals do the work.

**North-star line to open and close with:**
> *"The wardrobe is the profile. Fashion is identity. And we built this whole company with two founders and a team of AI agents — for $80K, not $2M."*

---

## 0. Before you start (pre-flight — do this 10 min before, off-camera)

- [ ] Open the app on the iPhone, complete onboarding once so you land on a populated account ("Noa", 7-day streak, ~13 closet items pre-seeded).
- [ ] Confirm Wi-Fi is on **and** test once in airplane mode — the demo is built to survive offline (scan, images, and checkout all have local fallbacks). If the venue Wi-Fi is shaky, **run the demo in airplane mode on purpose.**
- [ ] Brightness to max. Silence notifications. Close every other app.
- [ ] Have one outfit photo saved in the camera roll (or be ready to snap one live).
- [ ] Bottom nav, left→right, is: **Feed · Store · AI · DM · Profile.** Know it cold.
- [ ] Optional backup: have `static/pitch.html` open in a browser tab and the [PITCH_DECK.md](PITCH_DECK.md) ready, in case the phone misbehaves.

**Golden rule:** if anything stalls for >2 seconds, keep talking and move to the next beat. Never wait on a spinner in front of an investor.

---

## 1. The hook — Noa's problem (0:00 → 0:30)

**Land on:** Feed (default screen) or Profile/closet.

**Say:**
> "This is Noa. She's 17, in central Israel. Her camera roll is full of outfit photos, she buys clothes off TikTok, and half her closet never gets worn. She has *nothing to wear* and a closet that's *full*. That's our user — and there are hundreds of millions of her."

Swipe the **Feed** once so they see a real, full-screen, scrollable fashion feed.

> "Everything you're about to see is one app. Five layers. Let me show you the loop."

---

## 2. Scan a look → closet fills itself (0:30 → 1:30) — **WOW #1**

**Tap:** the camera / scan prompt (the "scan" tile on Home, or the capture button on Profile). Pick the saved outfit photo (or snap one live).

**While the AI spinner runs ("AI is identifying your items…"), say:**
> "She photographs an outfit. Our AI identifies every garment — top, bottoms, shoes — and turns each one into a *clean catalog image*, not a blurry phone photo."

**When the items appear, say:**
> "That's the magic: the closet builds itself. Every scan makes our recommendations sharper. That's our moat — a knowledge graph that compounds. A competitor starting today starts from zero."

> 💡 *This step has a built-in offline fallback — scan always returns a real, clean result even with no signal. You will never see an error here.*

---

## 3. AI Stylist suggests a look (1:30 → 2:15) — **WOW #2**

**Tap:** **AI** (bottom nav → outfits) — or the occasion picks on Home.

**Say:**
> "Now the stylist works *for* her. It reads the occasion and the season — 'Date Night', 'Work Ready', 'Street Style' — and builds a full outfit, pulling pieces she already owns *and* one or two she could buy."

Point at one generated outfit (the 2×2 image grid).

> "This is the part that took a $2M team a year. For us it's one screen, live, today."

---

## 4. The shoppable feed (2:15 → 3:00)

**Tap:** **Feed** (bottom nav). Show the three tabs: **For You · Your Match · Following.**

**Say:**
> "The social layer. TikTok-style looks from creators — but every look is *shoppable*. See the 'Shop $X' button? Noa doesn't leave the app to buy."

Tap a post's **Shop / Buy this look** to open the look sheet with its itemized pieces.

> "Influencers are our growth channel *and* our supply. They post, people buy, everyone wins."

---

## 5. Buy in-app → it lands in the closet (3:00 → 3:50) — **WOW #3**

**From the look sheet, tap Buy / Add to bag → confirm the (simulated) checkout.**

**Say:**
> "In-app checkout. No redirect, no leaving the app. Behind this is an affiliate network on day one — 5 to 15% commission, zero inventory, zero logistics."

**Now tap Profile (closet) and show the just-bought item sitting on the shelf.**

> "And here's the loop closing: she bought it, and it's *already* in her closet — clean catalog image and all. Scan, style, shop, own. That's the core loop."

---

## 6. Creator earns — the Wallet (3:50 → 4:25) — **WOW #4**

**Tap:** Home → **Wallet** (quick action), or navigate to the Wallet screen.

**Say:**
> "Every purchase credited to the creator whose look drove it. Append-only ledger, idempotent, real backend. The creator sees their balance and earnings grow. *This* is why influencers bring their audience to us instead of just tagging a link."

Point at the balance + earnings history.

---

## 7. The closer — built by agents (4:25 → 5:00) — **WOW #5 / the thesis**

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
| 1. Hook | Feed | 0:30 |
| 2. Scan → closet | Camera → Closet | 1:30 |
| 3. AI Stylist | AI (outfits) | 2:15 |
| 4. Shoppable feed | Feed | 3:00 |
| 5. Buy → closet | Look sheet → Profile | 3:50 |
| 6. Wallet | Wallet | 4:25 |
| 7. Built by agents | Agent Team | 5:00 |

---

## If something breaks (recover, don't apologize)

- **Spinner hangs >2s:** keep narrating, swipe to the next screen. The story continues without it.
- **No network:** the demo is built for this — scan, images, and checkout all fall back locally. *Use airplane mode if the venue Wi-Fi is unreliable.*
- **Phone dies / freezes:** switch to `static/pitch.html` (the deck) on a laptop and walk the same 7 beats verbally. Same story, no phone.
- **Investor asks a hard money question mid-demo:** "Great question — I'll hit that on the model slide right after." Finish the flow first; the product is the wow.

---

## What each beat proves (so you can answer "so what?")

| Beat | The point an investor should take away |
|------|----------------------------------------|
| Scan | Defensible data moat that compounds per user |
| Stylist | Hardest-to-build layer, already live |
| Shoppable feed | Distribution = creators, built into the product |
| In-app buy | Revenue on day one (affiliate), no inventory risk |
| Wallet | Two-sided flywheel — creators are *paid*, not just tagged |
| Built by agents | 25× capital efficiency — the real reason to bet on us |

---

*C2 — owner: CMO + Ayalon. Status: draft ready for dry-run. Do a timed dry-run twice before the meeting and lock the wording you're comfortable with. Source of truth for the flow: this file + [MASTER_PLAN.md](../.claude/master/MASTER_PLAN.md) §Track C.*
