# UX Rules Detail — AWEAR (reference for ui-ux-pro-max)

Full rule detail with code examples. The trigger, priority table, and pre-delivery checklist
live in `SKILL.md` — this file is the depth behind them.

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
- Use the type scale from `docs/VISUAL_VISION.md` (חלק ג׳), never freehand sizes

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
