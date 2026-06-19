---
name: ui-ux-pro-max
description: UX quality rules and interaction checklist for AWEAR — use when checking accessibility compliance, touch targets, loading states, error feedback, hover behavior, z-index management, or animation timing. Complements frontend-design (visual system) and code-reviewer (code quality). Not for style selection — AWEAR's visual system is fixed in docs/VISUAL_VISION.md.
---

# UI/UX Pro Max — AWEAR

UX quality rules that complement the visual design system. AWEAR's style, tokens, and fonts are
fixed in `docs/VISUAL_VISION.md` — this skill is not for choosing those. It's for getting the
**interaction quality, accessibility, and behaviour** right.

**Stacks:** vanilla JS SPA (`static/index.html`) and React Native/Expo (`mobile/`).

---

## Rule Categories

| Priority | Category | Where it matters most |
|----------|----------|-----------------------|
| 1 | Accessibility | Both SPA + RN |
| 2 | Touch & Interaction | Both — mobile-first app |
| 3 | Performance | SPA (no build optimiser) |
| 4 | Layout & Responsive | SPA |
| 5 | Typography sizing | SPA |
| 6 | Animation | SPA |

---

## 1. Accessibility — CRITICAL

These are the issues that break the experience for screen readers and keyboard users.

**In `static/index.html`:**
```js
// ✅ Icon-only buttons must have aria-label
`<button aria-label="${t('closet.delete_item')}" class="del-btn">...</button>`

// ✅ Images from scan results must have alt
`<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="item-img">`

// ✅ Form inputs must have labels (or aria-label if label is visually hidden)
`<label for="chat-input">${t('chat.input_label')}</label>
 <input id="chat-input" ...>`
```

**Rules:**
- Minimum contrast ratio **4.5:1** for normal text, **3:1** for large text
- All `<button>` elements with only an icon: add `aria-label`
- All meaningful images: add `alt` with descriptive text
- Tab order must match visual order — avoid `tabindex > 0`
- Form labels: `<label for="id">` tied to input, not just nearby text

**To audit:**
```bash
grep -n "<button" static/index.html | grep -v "aria-label\|aria-labelledby\|<button[^>]*>[^<]*<" | head -20
grep -n "<img" static/index.html | grep -v "alt=" | head -20
```

---

## 2. Touch & Interaction — CRITICAL

AWEAR is mobile-first. Touch target failures are invisible on desktop but critical on phone.

**Touch targets:** minimum **44×44px** on all interactive elements.
```css
/* ✅ Nav buttons, icon buttons, any tappable element */
.nav-btn { min-width: 44px; min-height: 44px; padding: 10px; }
.del-btn  { min-width: 44px; min-height: 44px; }
```

**Cursor pointer:** every element with a click listener must have `cursor: pointer`.
```js
// ✅ In render functions — cards, rows, anything tappable
`<div class="item-card" style="cursor:pointer" onclick="...">` // ← ONLY acceptable inline style
// Better: via CSS class that includes cursor-pointer
```

**Loading states:** disable the button during async operations — never let the user double-submit.
```js
const btn = document.getElementById('analyze-btn');
btn.disabled = true;
btn.textContent = t('common.loading');
try {
  const res = await fetch('/api/analyze', {...});
  // handle response
} finally {
  btn.disabled = false;
  btn.textContent = t('common.analyze');
}
```

**Error feedback:** error messages must appear near the problem, not as a generic toast.
```js
// ✅ Inline error below the field
document.getElementById('form-error').textContent = t('error.required_field');
document.getElementById('form-error').style.display = 'block';
// Then clear on next user interaction
```

**Hover transitions:**
```css
/* ✅ Use transition-property + duration, never instant */
.item-card { transition: box-shadow 200ms ease, background-color 150ms ease; }
.item-card:hover { box-shadow: 0 4px 16px var(--shadow); background: var(--card-hover); }
/* ❌ Scale transforms that shift layout */
.item-card:hover { transform: scale(1.05); }  /* breaks surrounding layout */
```

---

## 3. Performance — HIGH

The SPA has no bundler. Everything loads synchronously.

**Avoid layout jumps** — when async data loads (wardrobe, profile), reserve the space:
```js
// ✅ Show skeleton or minimum-height container, then replace
document.getElementById('home-wrap').innerHTML = `<div class="skeleton-card"></div>`;
const data = await fetch(...).then(r => r.json());
document.getElementById('home-wrap').innerHTML = renderHomeContent(data);
```

**Avoid heavy DOM re-renders** — never `innerHTML +=` in a loop. Build the full HTML string first, then set once:
```js
// ❌ Triggers reflow on every iteration
items.forEach(item => { container.innerHTML += `<div>${item.name}</div>`; });

// ✅ Build string, set once
container.innerHTML = items.map(item => `<div>${esc(item.name)}</div>`).join('');
```

**Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Layout & Responsive — HIGH

**z-index scale** — never use arbitrary numbers. Use only this scale:
```css
/* Define once, use everywhere */
--z-base:    10;   /* cards, sections */
--z-overlay: 20;   /* dropdowns, tooltips */
--z-sheet:   30;   /* bottom sheets */
--z-modal:   50;   /* modals */
--z-toast:   100;  /* toasts, alerts */
```

**Fixed nav height** — any fixed/sticky element must have its height reserved:
```js
// When a fixed nav is 56px tall, content must start below it
document.getElementById('main').style.paddingTop = '56px';
// Or set via CSS variable: --nav-height: 56px;
```

**No horizontal scroll** — test at 375px viewport width. Any `min-width` wider than viewport causes scroll.
```bash
# Playwright check: verify no horizontal overflow
page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
# Should be false
```

---

## 5. Typography — MEDIUM

- Body text: **minimum 16px** on mobile (anything below is a zoom trap)
- Line height: **1.5–1.75** for paragraphs, 1.2–1.3 for headings
- Line length: **65–75 characters max** — use `max-width: 65ch` on text containers
- Use the type scale from `docs/DESIGN_STANDARDS.md`, never freehand sizes

```css
/* ✅ Content containers with readable line length */
.feed-card-body { max-width: 65ch; }
.closet-description { font-size: var(--text-base); line-height: 1.6; }
```

---

## 6. Animation — MEDIUM

- Micro-interactions (hover, tap feedback): **150–200ms**
- Screen transitions (view changes): **250–300ms**
- Never animate `width`, `height`, or `top/left` — use `transform` and `opacity` only (GPU-accelerated)
- Stagger on lists: `animation-delay: calc(var(--i) * 40ms)` for delight without chaos

```css
/* ✅ GPU-accelerated reveal */
.item-card { opacity: 0; transform: translateY(8px); transition: opacity 200ms, transform 200ms; }
.item-card.visible { opacity: 1; transform: translateY(0); }

/* ❌ Causes layout thrashing */
.item-card:hover { width: 105%; height: 105%; }
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
- [ ] All colors use `var(--token-name)` — zero hardcoded hex/rgb values
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
