# SURFACE SPECS — locked end-states (anti-oscillation)

**Why:** the 3 core screens were re-polished 3× each and oscillated — a decision was made, then
reverted a cycle later, then re-made (IDEAS #29/#31/#32). This file records the **locked end-state
decisions** so agents stop re-litigating finished surfaces. (OW-011)

**Rules:**
- A decision marked **🔒 LOCKED** must NOT be re-opened by an agent. Only a `FOUNDER_QUESTIONS`
  ANSWERED directive or a measured metric may change it — and then this file is updated first.
- `scripts/guard_checks.sh` enforces the machine-checkable locks (see each item).
- Polish is allowed only if it does NOT touch a locked decision and does NOT re-touch an
  area+topic already `done` in `activity_log`.
- Authority to change a lock: Carmel/Razi (board) or Mark/Ayalon with a cited metric.

---

## Global
- 🔒 **No emoji in UI chrome** — `icon()` / inline SVG only (DS-008). *Enforced.*
- 🔒 **No hardcoded hex in CSS props** — `var(--token, fallback)` (DS-004). *Enforced.*
- 🔒 **Header clears the Dynamic Island** — `padding-top: max(…, env(safe-area-inset-top))`
  on `header`, `viewport-fit=cover`. Do NOT remove. (notch gate). *Enforced.*
- 🔒 **Benchmark = Instagram · Pinterest · Zara.** Not TikTok/Depop/Linear (DS-015).

## Feed (`showView('feed')`)
- 🔒 **Tabs = "For You" + "Following" only.** "Your Match" was merged into "For You"
  (wardrobe-personalized). Do NOT re-add a third discovery tab.
- 🔒 **Every post has like · comment · save · share.** Do NOT remove the comment action.
- 🔒 **Like animation = Instagram-style center burst** on tap and double-tap. Do NOT replace with
  a small icon-scale bump.
- 🔒 **Item pills use the per-garment-type icon** (resolved from product category), never a generic
  shirt for all.
- ✅ Polish allowed: spacing, typography, image quality — **not** the action set or tab structure.

## Profile (own — `renderCloset`)
- 🔒 **Opens on the "Looks" tab.** Tab order: **Looks · Closet**. No "For Sale" tab (selling lives
  in Market → My Store).
- 🔒 **Username sits directly under the avatar**, not beside the stats.
- 🔒 **No "Buy" CTA on your OWN items/looks.** Buy affordances appear only on *other* users'
  profiles (`renderUserProfile`).
- 🔒 **Block is demoted** — not on feed cards; only in the profile (…) menu under Report.
- ✅ Polish allowed: the season card is intentionally a quiet pill — keep it low-prominence.

## Item-detail sheet (`openSheetItem`)
- 🔒 **The Buy CTA stays PRESENT and PROMINENT.** It was quieted in a prior cycle and
  purchase-intent regressed (IDEAS #29/#31/#32). Do NOT de-glow / demote / hide it again.
- 🔒 **No external "Google Shopping" wording or redirect.** Buy routes in-app via `/api/orders`
  (P2P preloved + dropshipping/affiliate retail). The user must feel the purchase is native.
- 🔒 **Sheet dismisses 3 ways** — swipe-down on the grab strip, backdrop tap, X button — and never
  traps page scroll (DS-018).
- 🔒 **Match-% has a single clear anchor** with the tiered colors + animated reveal. One price
  anchor, not two competing ("$X" vs "From $X").
- ✅ Polish allowed: collage layout, micro-animation — **not** the Buy prominence or buy routing.

## AI Stylist (`showView('outfits')`)
- 🔒 **Daily check-in / streak / private journal** live here, wired to `/api/daily-log`
  (private by default).
- 🔒 **Build Look + matching items render as a Whering-style flat-lay collage**, not a plain grid.
- ✅ On-body try-on is a FUTURE stage (do not attempt now unless a directive says so).

## Store / Market (`showView('marketplace')`)
- 🔒 **Opens on "My Store".** Following-vs-discover is a filter inside **Community**.
- 🔒 **Pre-loved listings support local / radius "Near me"** (geolocation opt-in + haversine).
