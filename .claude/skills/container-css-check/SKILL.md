---
name: container-css-check
description: Before adding any HTML element to an existing container in static/index.html, audit the container's CSS (overflow, position, z-index, stacking context). Prevents elements from being invisible due to CSS layering.
---

# Container CSS Check — Before Adding Elements

## What happened (2026-06-17 — postmortem)

Shira added reactions + comments HTML inside `.feed-card-full`. That container had:
- `overflow: hidden`
- All existing children positioned with `position: absolute`

The new reactions were in normal document flow — completely hidden behind the background layer.
They were invisible to every user. The bug passed JS syntax validation and code review. It was
only caught when Carmel opened the browser and saw nothing.

Both bugs from that postmortem were visible to the eye within **10 seconds** in a real browser.
Neither was caught before merge.

## The rule

> Before inserting any new element into an existing container, read that container's CSS —
> specifically `overflow`, `position`, `display`, and any stacking context properties.

## How to audit a container before adding to it

1. Find the container's CSS rules:
   ```bash
   grep -n "feed-card-full\|\.your-target-class" static/index.html | head -20
   ```

2. Look for these danger flags:
   - `overflow: hidden` — your element may be clipped
   - All siblings `position: absolute` — your normal-flow element will go behind them
   - `position: relative` + `z-index` stacking — check if you need to match z-index
   - `display: none` on a parent — nothing inside will render

3. Check what siblings look like:
   ```bash
   # Find the container and look at nearby HTML structure
   grep -n "feed-card-full" static/index.html
   # Then read ~20 lines around that area to see sibling positioning
   ```

## The fix pattern

If the container's children are all `position: absolute`:

```css
/* ✅ Match the existing positioning scheme */
.your-new-element {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 2;  /* above other absolute children if needed */
}
```

If `overflow: hidden` is clipping your element, you may need to restructure the container — but
that's a design decision, not a one-line CSS fix. Escalate to Mark if the feed card structure
needs changing.

## After adding — run verify-rendering

Per Iron Rule #9 (`daily_model.md`): any commit touching HTML/CSS rendering must pass a real
browser check. Run `/verify-rendering` and visually confirm your new element is actually visible.
Don't rely on "the code looks right."
