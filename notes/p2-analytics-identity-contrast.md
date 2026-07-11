# P2 — Analytics identity-card contrast (mark lane, 2026-07-11)

**Status: DONE + GATED (gabbana 8.5/10 PASS).**

## What shipped (branch auto/mark, static/app.css only)
Three gabbana findings from 2026-07-10 fixed exactly per spec (valentino):
- `.an-identity-kicker` (app.css:2262): 88%-opacity color-mix → full `var(--text-on-accent,#fff7f2)` + the
  range/pill text-shadow (`0 1px 2px rgba(0,0,0,.18)`). Was ~3.4:1 on the gradient edge.
- `.an-identity-pill` (app.css:2266): bg white-32% → white-20% color-mix (chips were washed out, ~3.1:1).
- `.an-identity-share` (app.css:2267): 36×44 → 44×44 touch target.
Plus the gate's follow-up (valentino, same run): `padding-right:56px` on `.an-identity-kicker` +
`.an-identity-name` so a long archetype ("The Eclectic Maximalist") can't paint over the enlarged
absolute-positioned share button (44 + 12 breathing room).

## Verification
node --check app.js exit 0 · npm run check-render "✓ render OK" · `node scripts/shot.mjs analytics
/tmp/an-identity.png` reviewed by mark AND gabbana: kicker readable, pills legible, no collision ·
gabbana re-gate 8.5/10 PASS, all 3 findings confirmed fixed, checklist 9/9.

## Craft attribution
valentino (3 fixes + padding guard, ~66k tokens) · gabbana (re-gate, ~44k) · mark (coordination/verify/commit).

## Gabbana non-blocking follow-ups (queue when .claude/agents writes return)
1. **Ghost token `--text-on-accent`** — used throughout app.css but defined in NO :root; the `#fff7f2`
   fallback is what always runs. Add `--text-on-accent:#fff7f2` to awear-tokens.json + tokens.css +
   app.css :root (netta; relates to the open P2 token-reconciliation item in mark.md).
2. Strict AA at 11-12px vs nominal `--hl` (#E84A5F) is ~3.6:1 (shadow doesn't count for WCAG); actual
   render is darker and passes. Cheap hardening if tokens ever lighten: darken the gradient start with
   `color-mix(in srgb, var(--hl,#e8526a) 88%, #000)`.
3. Bare `#ffffff` inside the card's color-mix patterns — pre-existing; resolves with follow-up 1.

## PENDING BOOKKEEPING — apply when `.claude/agents/**` write access returns (still blocked this run, 2 attempts)
1. **activity_log.md** append:
   `| 2026-07-11 | valentino (mark lane) | auto/mark / static/app.css | done | P2 analytics identity-card contrast (gabbana 2026-07-10 findings): kicker to full-opacity text-on-accent + shadow, pill bg white-32%→20%, share button 36→44px, + padding-right:56px guard on kicker/name so long archetypes can't paint over the button. check-render green; screenshot verified; gabbana re-gate 8.5/10 PASS. |`
2. **contributions/2026-07-11.md** rows (create file with earlier rows from notes/p1-stubs-dead-code.md too):
   `| 19:3x | valentino | mark | ~66k | P2 identity-card contrast fixes + padding guard |`
   `| 19:4x | gabbana | mark | ~44k | Re-gate identity card — 8.5/10 PASS |`
3. **assignments/mark.md**: flip `## [ ] P2 — Analytics identity-card pre-existing contrast` → `[x]`
   with `> DONE 2026-07-11 (valentino craft, gabbana 8.5/10). Detail: notes/p2-analytics-identity-contrast.md`.
   ALSO still pending from the previous run: flip the P1 stubs item → [x] + add the stale-copy P2
   (see notes/p1-stubs-dead-code.md §PENDING).
