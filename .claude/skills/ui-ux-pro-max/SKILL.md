---
name: ui-ux-pro-max
description: UX quality rules and interaction checklist for AWEAR — use when checking accessibility compliance, touch targets, loading states, error feedback, hover behavior, z-index management, or animation timing. Complements frontend-design (visual system) and code-reviewer (code quality). Not for style/token selection — AWEAR's visual system is fixed in docs/VISUAL_VISION.md and .claude/rules/design-tokens.md.
allowed-tools: Read, Grep, Glob, Bash
---

# UI/UX Pro Max — AWEAR

UX quality rules that complement the visual design system. AWEAR's style, tokens, and fonts are
fixed in `docs/VISUAL_VISION.md` + `.claude/rules/design-tokens.md` — this skill is not for
choosing those. It's for getting the **interaction quality, accessibility, and behaviour** right.

**Stacks:** vanilla JS SPA (`static/index.html`) and React Native/Expo (`mobile/`).

## Rule Categories

Full detail + code examples per category: **`ux-rules.md` in this skill dir** — read the sections
relevant to your change.

| Priority | Category | Where it matters most | Core rule (one line) |
|----------|----------|-----------------------|----------------------|
| 1 | Accessibility — CRITICAL | Both SPA + RN | aria-label on icon buttons, alt on images, `<label for>`, contrast 4.5:1 |
| 2 | Touch & Interaction — CRITICAL | Both — mobile-first app | 44×44px targets, cursor:pointer, disable during async (`finally{}`), inline errors |
| 3 | Performance — HIGH | SPA (no build optimiser) | no `innerHTML +=` loops, reserve space for async data, `prefers-reduced-motion` |
| 4 | Layout & Responsive — HIGH | SPA | z-index only from scale (10/20/30/50/100), no horizontal scroll @375px, reserve fixed-nav height |
| 5 | Typography sizing — MEDIUM | SPA | body ≥16px mobile, line-height 1.5–1.75, `max-width: 65ch` |
| 6 | Animation — MEDIUM | SPA | 150–200ms micro / 250–300ms screen, `transform`+`opacity` only |

**Quick audit greps (accessibility):**
```bash
grep -n "<button" static/index.html | grep -v "aria-label\|aria-labelledby\|<button[^>]*>[^<]*<" | head -20
grep -n "<img" static/index.html | grep -v "alt=" | head -20
```

---

## Pre-Delivery Checklist — AWEAR

Run through this before marking any UI task done (in addition to the verify-rendering Playwright check):

### Interaction
- [ ] All clickable/tappable elements have `cursor: pointer`
- [ ] All touch targets ≥ 44×44px
- [ ] Async buttons disabled during load, re-enabled in `finally {}`
- [ ] Error messages appear near the problem field, not only as toast
- [ ] Hover transitions use `transition:` with 150–300ms, not instant

### Visual (AWEAR design system)
- [ ] All colors use `var(--token-name)` — zero hardcoded hex/rgb values (token table: `.claude/rules/design-tokens.md`)
- [ ] All spacing, border-radius, shadow from tokens
- [ ] No emojis in interactive UI (icons = SVG) — Gabbana P0 rejection
- [ ] No inline `style=""` except `cursor:pointer` (and justify it)
- [ ] Contrast ≥ 4.5:1 for body text in both light and dark states

### Accessibility
- [ ] Icon-only buttons have `aria-label`
- [ ] Meaningful images have `alt` text
- [ ] Form inputs tied to labels via `for`/`id`
- [ ] Tab order matches visual order
- [ ] `prefers-reduced-motion` respected in CSS

### Layout
- [ ] No horizontal scroll at 375px viewport
- [ ] Fixed navbars don't cover content (padding-top reserved)
- [ ] z-index values from the defined scale, not arbitrary numbers
- [ ] Line length ≤ 75ch on text-heavy sections

### After all checks pass
- Run `verify-rendering` skill (Playwright) — mandatory per Iron Rule #9
- If new CSS file or JS module added: run `wire-it-up` check
- If elements added to existing container: run `container-css-check`

---

## Relation to Other Skills

| Skill | What it owns |
|-------|-------------|
| `frontend-design` | Visual style, tokens, typography scale, motion language, Gabbana approval |
| `code-reviewer` | Code-level checks (SQL, TDZ, inline styles, i18n coverage) |
| `ui-ux-pro-max` | Interaction quality, accessibility depth, animation timing, z-index, touch |
| `verify-rendering` | The mandatory browser render check |
