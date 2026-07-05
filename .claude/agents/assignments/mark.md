# Design lane (mark) — assignments

> Source: Fable-5 frontend audit, 2026-07-05. Files: index.html (shell), app.css (CSS), app.js (JS).
> Do the demo-breaking bugs FIRST, one per run. Verify each: `npm run check-render` + screenshot the screen.

## [x] P0 — Two blank-screen navigation bugs (make the app look broken in a demo)
> DONE (commit e862b2d; verified 2026-07-05 by mark: grep finds no showView('wardrobe')/showView('onboarding') in app.js)
1. `showView('wardrobe')` — there is NO `#wardrobe` view; the Marketplace sell-tab CTA blanks the whole
   screen. Change to `showView('closet')`. Evidence: `app.js:4402` (handler), `app.js:4477` (button).
2. Home checklist "style quiz" step calls `showView('onboarding')` (not a `.view`) → blanks the main area.
   Replace with `showOnboarding()`. Evidence: `app.js:2367`; correct fn at `app.js:6718`.
Verify: navigate both paths in a browser (node scripts/shot.mjs) — no blank screen.

## [x] P0 — Raw `${icon('sparkle',16)}` text ships literally in the Compare CTA
> DONE (commit e862b2d; verified 2026-07-05 by mark: grep finds no icon('sparkle' literal in index.html)
Evidence: `index.html:151` — it's static HTML, not a JS template, so the user sees the literal string.
Replace with inline SVG (DS-008: icon() is JS-templates-only).

## [x] P1 — Dark-theme relics on the light theme (this IS the "black on black")
> DONE 2026-07-05 (mark run, netta craft, gabbana gate 9/10): .adm-grade-card/.sus-score-card → var(--success-surface) + color-mix borders; AA ink on mint (10.5:1); body/shelf-ledge bare hex tokenized. app.css bare hex outside :root now 0 (except intentional #ffffff color-mixes).
`.adm-grade-card` / `.sus-score-card` hardcode `linear-gradient(135deg,#0d1f10,#122018)` (near-black) while
`--success` is now dark green → dark-green text on near-black. Evidence: `app.css:1379,1382,1550-1551`.
Swap to a light-safe treatment (var(--success-surface) bg + readable text). Screenshot to confirm contrast.

## [ ] P1 — Stubs & dead code
- "New post" is a stub toast (`app.js:1829`); stylist "Video call"/"Chat" go nowhere (`app.js:7967`) — either
  wire (chat → `showView('dm')`) or remove the buttons so the demo has no dead ends.
- Dead code to DELETE: the entire emoji-reactions subsystem (`reactionsHTML` has zero call sites, ~150 lines,
  `app.js:7185` + seeds `6905-6931` + no-op `bindReactions`), and 7 dead functions (buyFlow, buyConfirm,
  comboPieceHTML, resetWardrobe, matchPercent, addPoints, addToWishlistFromItem).

## [ ] P0 — Tokenize hardcoded colors + kill black-on-black (theme migration finish)

**Why (founder, verified):** ~762 hardcoded hex values live in `static/index.html` and
bypass the token system. `static/tokens.css` is a *designed* dual theme (dark `:root`
default + `@media (prefers-color-scheme: light)` override). Colors written as raw dark-theme
hex do NOT adapt to light mode → light text on light bg / dark on dark ("black on black"),
which the founder sees as bugs. Root cause = an unfinished dark→light tokenization, NOT a
design decision. Fixing it fixes the whole class at once and makes BOTH themes correct.

**Task — do it in SMALL, VERIFIED batches (one screen/area per run), never a blind mass-replace:**
1. Pick ONE screen (start with the demo-critical order: feed → closet → profile → stylist → shop).
2. In that screen's CSS only, replace each hardcoded hex with its token, using the DARK-`:root`
   value as the map (add the exact fallback per DS-004):
   `#0e0c0f→var(--bg,#0e0c0f)` · `#161318→var(--surface,#161318)` · `#1e1a22→var(--card,#1e1a22)` ·
   `#262030→var(--card-hover,#262030)` · `#2e2836→var(--line,#2e2836)` · `#f0ecf5→var(--fg,#f0ecf5)` ·
   `#fbfbfd→var(--text,#fbfbfd)` · `#9e99ad→var(--muted,#9e99ad)` · `#e8526a→var(--accent,#e8526a)` ·
   `#c4855a→var(--accent2,#c4855a)` · `#7a6af0→var(--accent3,#7a6af0)` · `#52c97a→var(--success,#52c97a)` ·
   `#e8a84a→var(--warning,#e8a84a)` · `#e05252→var(--danger,#e05252)`.
   Leave `#fff` (too generic — decide per case), inline SVG `fill=`/`stroke=`, seasonal
   tokens (`--summer-*`, theme-independent by design), and any hex inside JS data/logic ALONE.
3. VERIFY VISUALLY (mandatory): `node scripts/shot.mjs <view> /tmp/shot.png` in BOTH modes if
   possible; confirm no contrast regressions; gabbana subagent must pass at 8+.
4. `npm run check-render` must pass. Commit that ONE screen. Next run = next screen.

**Definition of done for the whole P0:** `grep -c '#[0-9a-fA-F]\{6\}' static/index.html` trends
toward ~0 in CSS contexts (per static/CLAUDE.md self-check), zero black-on-black on any screen,
both light and dark render cleanly. Track progress in DAILY_DIGEST.md.

## [ ] P2 — Token reconciliation: --success defined 3x with 3 values + --muted fails AA on white (netta)
Gabbana re-gate finding (2026-07-05): awear-tokens.json says --success:#4ade80, tokens.css #52c97a/#1A9E52,
app.css :root (the winner) #1a7a4a — SoT drift, DS-005. Also --muted #8A857E on white = 3.66:1 (fails AA for
sub-labels like "10/13 items worn"). Reconcile the three sources to one audited value set + darken --muted
to an AA-passing value. WCAG check + screenshot comparison before merge (DS-005).
