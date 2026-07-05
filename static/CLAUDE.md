# Frontend / static/ rules (auto-loaded in static/ context)

Supplement to root CLAUDE.md. Applies to Dolce, Oren, Shira, Gabbana, Netta.
Token values + usage rules: `.claude/rules/design-tokens.md` (SoT: `awear-tokens.json`).

## DS self-check before every Gabbana review
```bash
grep -c "✓\|⚠️\|✨\|🎉\|➕\|🌸" static/index.html           # → 0 (hardcoded UI emoji)
grep -n "\.emoji\b" static/index.html | grep -v "search_query\|//\|#"  # → 0 (data emoji in renders)
grep -c "font-size.*52px\|font-size.*54px" static/index.html  # → 0
grep -c "#[0-9a-fA-F]\{6\}" static/index.html                # → should decrease each cycle
grep -c "var(--t-" static/index.html                          # → should increase each cycle
grep -c "var(--t-sm)\|var(--t-lg)\|var(--t-md)" static/index.html  # → 0 (these tokens don't exist)
```

## icon() cheat sheet
```js
icon('heart', 20)        // like button
icon('check', 16)        // confirmation / wore-it
icon('messageCircle', 16) // comment
icon('bell', 20)         // notification
icon('search', 18)       // search
icon('user', 20)         // profile
icon('shoppingBag', 20)  // marketplace
icon('camera', 24)       // camera / upload
icon('bookmark', 18)     // save
icon('share', 18)        // share
icon('alertTriangle', 14) // warning (replaces ⚠️)
// New icon: add SVG path to ICONS object — no CDN
```

## Gabbana P0 criteria (visual blockers)
- emoji rendered in DOM from data arrays (stories, stylists, products)
- hardcoded hex in CSS properties (not in data/comments)
- font-size on .sf-card-img, .mp-item-img, .ptile .pimg, .pc-feat-cover
- touch targets < 44px on interactive elements
- var() without fallback in dynamic context

## Efficient index.html editing
```bash
# Find a function — don't read the whole file
grep -n "function renderFeed\|drawFeed\|function.*feed" static/index.html | head -5
# Read only 40 lines around it
# Tool: Read with offset=<line> limit=40
```
