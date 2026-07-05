# Design lane (mark) — assignments

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
