---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces for AWEAR with high design quality. Use when building web components, pages, or UI elements in static/index.html or mobile/. Generates creative, polished code within AWEAR's established design system — not from scratch. Not for UX/accessibility audits (ui-ux-pro-max) or post-hoc code review (code-reviewer).
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

This skill guides creation of distinctive, production-grade frontend interfaces for AWEAR that
avoid generic "AI slop" aesthetics — while working within the established design system.

The user provides frontend requirements: a component, page, or UI element to build. They may
include context about the purpose, audience, or technical constraints.

## AWEAR Design System — Read Before Anything Else

AWEAR has an established visual system. You do not choose fonts, colors, or spacing from scratch.

**Sources of truth (read in this order):**
1. `docs/VISUAL_VISION.md` — Design Master Plan: vision, colors, typography, motion, grid, DoD
2. `.claude/rules/design-tokens.md` — the token table + usage rules (single source; do not copy it here)
3. `awear-tokens.json` — token SoT that generates `static/tokens.css` — to change a token, edit the json, never the css

**Hard rules:**
- Use `var(--token-name)` for every color, spacing, radius, shadow, and z-index value
- Do not introduce new font families — the type system is defined in `docs/VISUAL_VISION.md`
- Do not hardcode hex values, px values for spacing, or color literals anywhere in new code
- Do not use `!important` to override the token system

If a token you need doesn't exist, **propose it to Netta** — do not improvise a value inline.

## Design Thinking (Within the System)

Before coding, understand the context:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: AWEAR = accessible luxury, editorial, photo-first, warm (not cold/tech). References: Instagram · Pinterest · Zara. The existing palette, typography, and spacing encode this — your job is to express it, not reinvent it.
- **Constraints**: `static/index.html` (vanilla JS/HTML/CSS SPA), React Native (`mobile/`), or both.
- **Differentiation**: What makes this screen or component genuinely useful and visually precise
  within the AWEAR world? Aim for that.

**What "distinctive" means in AWEAR context:**
Not a new color scheme — but exceptional spatial composition, motion that feels intentional,
typography hierarchy that guides the eye, and details that make the screen feel crafted rather
than assembled. The design system is the constraint that forces creativity into the right channels.

## Implementation Quality

Implement working code that is:
- Production-grade and functional (no placeholder content, no TODO comments)
- Visually precise — spacing, alignment, and sizing from tokens, not approximations
- Cohesive with every other screen in the app (read 2-3 nearby screens in `static/index.html`
  before writing a single line)
- Passing Gabbana's P0 checklist (see below) before you consider it done

## Aesthetics — What to Focus On

**Typography:**
Use the type scale from `VISUAL_VISION.md`. Hierarchy matters: one clear heading, one body
weight, one accent weight per screen — no more. Avoid `font-weight: 500` everywhere (that's the
typographic equivalent of no hierarchy).

**Color:**
Dark background (`--bg`), card surfaces (`--card`), single accent (`--accent`). Use accent
sparingly — one dominant use per screen, not scattered across every interactive element.

**Motion:**
CSS transitions on interactive states (hover, focus, active). For screen transitions or reveal
moments, staggered `animation-delay` creates delight without chaos. Every animation must have a
clear purpose — it communicates state change or guides attention, not decoration.

**Spatial composition:**
Generous negative space in editorial sections. Controlled density in data-heavy sections. Overlap
and layering (within `overflow` and `z-index` constraints — see `/container-css-check` skill)
create depth without complexity. Asymmetry is allowed; chaos is not.

**Backgrounds and depth:**
The established palette is dark. Within that: subtle gradients (`--bg` to `--card`), thin
borders (`1px solid var(--line)`), and carefully layered shadows create atmosphere without
violating the system. No grain overlays or noise textures unless explicitly in `VISUAL_VISION.md`.

## What to Avoid

- **Emoji as UI elements** — P0 rejection by Gabbana. Icons = SVG with `currentColor`, always.
- **Bitmoji/placeholder product images** — a garment is always a real product photo or a designed
  fallback, never an emoji or colored rectangle.
- **Hardcoded values** — any literal `#`, `px` for spacing, or font name that isn't from the token
  system is a design system violation.
- **Inline styles** — all styling goes through CSS classes or token variables.
- **New font imports** — don't add `@import` from Google Fonts or similar without Netta's approval.
- **Generic AI layouts** — centered hero, purple gradient, card grid with equal spacing — these are
  the patterns that make AWEAR look like every other app.

## Approval Flow — This Is Not Optional

Your output is not done when the code works. In AWEAR:

```
You implement → Gabbana reviews (separate dispatch) → Mark approves → Jeff merges
```

Before handing off to Gabbana, self-check:
1. Every color/spacing value is from a token — no literals
2. No emoji in UI chrome (icons, badges, navigation)
3. Every product/garment shown is a real image or designed fallback
4. Contrast ≥ WCAG AA on all text
5. Touch targets ≥ 44px on all interactive elements
6. Ran `/verify-rendering` and confirmed the screen actually renders correctly in browser

If any of the above fails — fix it before Gabbana sees it. Gabbana's P0 list is a hard rejection,
not a list of suggestions.

## After Implementing

Per Iron Rule #9 (`daily_model.md`): run `/verify-rendering` before marking any UI change as done.
Per `/wire-it-up` skill: confirm any new CSS file is linked, any new JS module is imported.
Per `/container-css-check` skill: if you added elements to an existing container, verify its
`overflow`/`position` didn't clip your new content.
