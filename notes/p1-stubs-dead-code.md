# P1 — Stubs & dead code (mark lane, 2026-07-11)

**Status: CODE DONE + GATED (gabbana 8/10 PASS); protocol bookkeeping PENDING (permission-blocked, see below).**

## What shipped (branch auto/mark)
- **"New post" dead-end removed** from the create menu (index.html button block, `openNewPostComposer` stub,
  icon injection, `.create-opt-ico.post` CSS). Menu keeps Scan a garment + Daily check-in. No real composer exists.
- **Stylist Video/Chat wired to the real booking overlay** via new `openBookingPreset(id,name,type)`
  (wraps `openBooking` + presets `#book-type`). DM route rejected: stylists aren't in `_profiles_cache`,
  `loadDMThread` would overwrite the header name with the raw stylist id (`st1`) after the async fetch.
  Availability gating added to Video/Chat byte-for-byte matching Book (gabbana P1: Busy stylist was bookable
  via the side door — Playwright-verified disabled on Busy, enabled on Available).
- **Dead code deleted (~180 net lines)**: 7 zero-caller functions (comboPieceHTML, buyConfirm, buyFlow,
  resetWardrobe, matchPercent, addPoints, addToWishlistFromItem) + orphaned getPostReactions + the
  never-rendered emoji-reactions subsystem (reactionsHTML/bindReactions/toggleReaction/loadReactions/
  saveReactions/REACTIONS_KEY/REACTION_SET/REACTION_ICONS/FEED_REACTIONS_SEED + `.fc-reaction*` CSS).
  Live comments subsystem kept intact (FEED_COMMENTS_SEED/loadComments/saveComments verified present).

## Verification
node --check app.js EXIT 0 · npm run check-render OK · grep sweep: 16 dead symbols = 0 leftovers across
static/ · addRewardPoints untouched (2 live call sites) · screenshots: stylists, feed, open create menu ·
gabbana gate 8/10 PASS (both required fixes applied: avail-gating + create-menu screenshot).

## Craft attribution
dolce (dead code + create menu, ~85k tokens) · valentino (stylist wiring + gate fix, ~130k) · gabbana (gate, ~48k).

## PENDING BOOKKEEPING — apply in the next session with `.claude/agents/**` write access
The permission layer denied ALL sessions (mark/dolce/valentino) write access to `.claude/agents/**`
mid-run (valentino's two activity_log rows landed before the window closed and ARE committed). Still to apply:
1. **activity_log.md**: append dolce's row —
   `| 2026-07-11 | dolce (mark lane) | auto/mark / static/app.js + app.css + index.html | done | P1 dead-code sweep: removed "New post" dead-end from create menu, 7 zero-caller functions + orphaned getPostReactions, and the never-rendered emoji-reactions subsystem while keeping live comments intact. node --check + check-render green; grep sweep 0 leftovers. |`
2. **contributions/2026-07-11.md**: create team ledger — dolce ~85k (dead-code sweep), valentino ~62k
   (stylist wiring) + ~68k (gate fix), gabbana ~48k (design gate 8/10).
3. **assignments/mark.md**: flip `## [ ] P1 — Stubs & dead code` → `[x]` with a DONE note pointing here,
   AND add a new item:
   `## [ ] P2 — Stale "Share a look to the feed" copy after New-post removal (gabbana follow-up 2026-07-11, dolce)` —
   Wallet "How it works" (`app.js` ~3767, grep "Share a look") + i18n `en.json:44` still describe posting a
   look as the first earn step but the only posting entry point was removed (was a dead-end toast anyway).
   Reword to scan/check-in flow or wait for a real composer — coordinate with MASTER_PLAN.

## Gabbana pre-existing nits (not from this change, low priority)
styl-price line wraps with an orphaned "·" (flex-wrap) · .styl-btn ~33-36px height < 44px touch target
(priority rose now that Video/Chat are real conversion buttons) · .book-overlay has no entry animation.
