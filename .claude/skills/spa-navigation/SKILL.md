---
name: spa-navigation
description: Orientation map for AWEAR's static/index.html — 5101-line vanilla JS SPA. Use before editing any frontend code to find the right function, HTML target, line range, or pattern. Covers view routing, render function map, i18n, localStorage state, and the global const/let order critical for TDZ safety.
---

# SPA Navigation — static/index.html

5101 lines · 146 functions · vanilla JS/HTML/CSS · no build step · served by FastAPI.

## The Only Router: `showView(name)` — line 1604

Every screen transition goes through one function. It:
1. Toggles `.active` on `<section class="view" id="name">` elements
2. Calls the render/init function for that view
3. Sets `feed-mode` / `chat-mode` CSS class on `<main>`

**To navigate programmatically:** call `showView('viewname')`. Never toggle `.active` directly.

---

## View Map — all 18 screens

| `showView(name)` | Function called | Defined at line | HTML render target |
|-----------------|----------------|-----------------|--------------------|
| `home` | `renderHome()` | 2473 | `#home-wrap` |
| `closet` | `renderCloset()` | 2143 | `#closet-body` |
| `feed` | `renderFeed()` | 2324 | `#feed-scroll` |
| `explore` | `initExplore()` | 3879 | `#ex-wrap` |
| `analytics` | `renderAnalytics()` | 2708 | `#analytics-wrap` |
| `outfits` | `initOutfitGen()` | 2822 | `#og-wrap` |
| `rewards` | `renderRewards()` | 3001 | `#rw-wrap` |
| `sustainability` | `renderSustainability()` | 3072 | `#sus-wrap` |
| `marketplace` | `renderMarketplace()` | 3147 | `#mp-wrap` |
| `publicclosets` | `renderPublicClosets()` | 3424 | `#pc-wrap` |
| `seasonal` | `renderSeasonalReport()` | 3498 | `#sr-wrap` |
| `compare` | `initCompare()` | 4933 | `#cmp-wrap` |
| `shopping` | `initShoppingFeed()` | 4866 | `#shopping` section |
| `admin` | `renderAdminDashboard()` | 4651 | `#adm-wrap` |
| `stylists` | `renderStylistMarketplace()` | 4729 | `#styl-wrap` |
| `wishlist` | `renderWishlist()` | 3662 | `#wl-wrap` |
| `chat` | `initChat()` | 3747 | `#chat-messages` |

**`home` is the default** — its `<section>` has `class="view active"` in HTML and `renderHome()` is called on page load. All constants it uses must be declared before that call.

---

## Adding a New View — 4 steps

1. **Add HTML section** (after line ~1353, before the `</main>`):
   ```html
   <section id="myview" class="view">
     <div class="mv-wrap" id="mv-wrap"></div>
   </section>
   ```

2. **Add nav button** (inside `<nav>`):
   ```html
   <button class="nav-btn" data-view="myview" data-i18n="nav.myview"></button>
   ```

3. **Add to `showView()`** (line ~1626, inside the function body):
   ```js
   if (name === 'myview') renderMyView();
   ```

4. **Write the render function** (after the last existing render function, around line 5000):
   ```js
   function renderMyView() {
     const data = loadWardrobe(); // or whatever state you need
     document.getElementById('mv-wrap').innerHTML = `
       <div class="section-header">${t('myview.title')}</div>
       ...
     `;
   }
   ```

5. **Add i18n keys** to both `static/i18n/en.json` and `static/i18n/he.json`.

6. **Wire it up check**: after adding, verify `showView('myview')` in console actually calls your function.

---

## Render Function Pattern

Every render function follows this structure:

```js
function renderFoo() {
  // 1. Load state
  const wardrobe = loadWardrobe();              // helper: returns array
  const prof = loadProfile();                   // helper: returns {name, handle, city, bio, photo}
  const meta = loadMeta();                      // helper: returns {}

  // 2. Compute derived data
  const items = wardrobe.filter(i => i.category === 'top');

  // 3. Build HTML and inject
  document.getElementById('foo-wrap').innerHTML = `
    <div class="foo-header">${t('foo.title')}</div>
    ${items.map(item => `
      <div class="foo-card" data-id="${attr(item.id)}">
        ${esc(item.name)}
      </div>
    `).join('')}
  `;

  // 4. Attach event listeners AFTER innerHTML is set
  document.querySelectorAll('.foo-card').forEach(card => {
    card.addEventListener('click', () => handleFooClick(card.dataset.id));
  });
}
```

**Always use** `esc()` for user-visible values, `attr()` for HTML attribute values.  
**Never** use `innerHTML +=` — always replace the full target at once.

---

## i18n Pattern

```js
// In JS render functions:
t('home.greeting_morning')          // simple key
t('home.look_n', {n: 3})           // with substitution → replaces {n}

// In static markup (HTML that exists before JS runs):
<span data-i18n="nav.closet"></span>   // applyStaticI18n() fills these at startup

// Adding new strings:
// static/i18n/en.json  →  { "home": { "my_key": "My text" } }
// static/i18n/he.json  →  { "home": { "my_key": "הטקסט שלי" } }
```

`t()` fails loud — returns the key itself if missing. Never returns blank. Means a missing key is immediately visible in the UI.

**LOCALE**: `'en'` (default) or `'he'` (opt-in). RTL applied automatically via `applyDocumentDirection()`.

---

## State — localStorage Helpers

All state lives in `localStorage`. Never read/write localStorage directly — use the helpers:

```js
loadWardrobe()      / saveWardrobe(arr)    // array of clothing items
loadProfile()       / saveProfile(obj)     // {name, handle, city, bio, photo}
loadMeta()          / saveMeta(obj)        // metadata object
loadShelf()         / saveShelf(arr)       // shelf items
loadFeedPosts()     / saveFeedPosts(arr)   // feed content
loadLastScan()      / saveLastScan(v)      // last scan timestamp

// Raw helper (for new keys):
ls.load('my_key')   // JSON.parse with null fallback
ls.save('my_key', value)  // JSON.stringify
```

**Clothing item shape** (from `ClothingItem` in app.py):
```js
{
  category: 'top' | 'bottoms' | 'dress' | 'outerwear' | 'shoes' | 'bag' | 'accessory',
  name: string,
  color: string,
  price_estimate_usd: number,
  wear_count: number,   // incremented on outfit use
  search_query: string, // for affiliate link generation
  buy_options: [...],
}
```

---

## Global const/let Order — TDZ Safety Map

Declarations execute top-to-bottom. Any `const`/`let` used inside a function called early must be declared at a lower line number than that call. **`renderHome()` is called at page load — line ~2473 and all its dependencies must be declared before that.**

Critical ranges:
| Lines | What's declared |
|-------|----------------|
| ~1434 | `LOCALE`, `STRINGS` (let) |
| ~1491 | DOM refs: `fileInput`, `closetBody`, `modal`, `modalCard`, `mainEl` |
| ~1499–1598 | `ICONS`, `CAT_ICON`, `CAT_LABEL`, `CAT_EMOJI` |
| ~1635–1732 | `sheetOverlay`, `STORE_LOGOS`, `AFF_RETAILERS`, `COMPLEMENTS` |
| ~2024–2045 | localStorage keys + helpers (`loadProfile`, `loadWardrobe`, etc.) |
| ~2054 | `profileTab` (let) |
| ~2143–4933 | All render functions |

**Safe zone to add a new constant:** between lines 2024–2100 (after the localStorage helpers, before the first render function).  
**Never add** a `const`/`let` after line 2473 that is referenced inside `renderHome()`.

---

## Key Helpers Reference

| Helper | Purpose |
|--------|---------|
| `esc(s)` | HTML-escape for `innerHTML` content |
| `attr(s)` | HTML-escape for attribute values |
| `t(key, vars?)` | i18n string lookup |
| `showView(name)` | Navigate to a screen |
| `showToast(msg)` | Display a toast notification — line 2426 |
| `showSheet()` / closing at line 1885 | Bottom sheet for buy options |
| `storeLogo(name)` | 3-letter retailer abbreviation |
