---
name: spa-navigation
description: Orientation map for AWEAR's static/index.html — an 11,754-line vanilla JS SPA. Use before editing any frontend code to find the right function, HTML target, line range, or pattern. Covers view routing, render function map, i18n, localStorage state, and the global const/let order critical for TDZ safety.
---

# SPA Navigation — static/index.html

11,754 lines · ~290 functions · vanilla JS/HTML/CSS · no build step · served by FastAPI.

> **Generated 2026-07-05 against 11,754 lines. Line numbers drift — trust the grep pattern; the number is only a hint.** If `wc -l static/index.html` differs by more than ~200 lines, regenerate this skill.

## File Structure — where you are

| Zone | ~Lines | Find it with |
|------|--------|--------------|
| CSS (`<style>`) | 15–2702 | `grep -n "^<style>\|^</style>" static/index.html` |
| HTML views (`<main>`) | 2717–2957 | `grep -n "<main id=\|</main>" static/index.html` |
| Bottom nav (`<nav>`) | 2959–2966 | `grep -n "data-view=" static/index.html \| head -6` |
| JS (`<script>`) | 3050–11752 | `grep -n "^<script>\|^</script>" static/index.html` |

## The Only Router: `showView(name)` — ~L3316 — `grep -n "function showView"`

Every screen transition goes through one function. It:
1. Toggles `.active` on `<section class="view" id="name">` elements and nav buttons
2. Calls the render/init function for that view
3. Sets `feed-mode` / `chat-mode` class on `<main>`, hides nav for chat, updates `VIEW_TITLES` header

**To navigate programmatically:** call `showView('viewname')`. Never toggle `.active` directly.

**Default view is `feed`** (not home): `<section id="feed" class="view active">` ~L2927, booted by `requestAnimationFrame(() => showView('feed'))` ~L5021 — `grep -n "Auto-render feed on load"`.

---

## View Map — all 22 screens

Sections: ~L2719–2956 — `grep -n '<section id=.*class="view'`

| `showView(name)` | Function | ~Line | Grep pattern | Render target |
|-----------------|----------|-------|--------------|---------------|
| `home` | `renderHome()` | 5292 | `"function renderHome"` | `#home-wrap` |
| `closet` | `renderCloset()` | 4314 | `"function renderCloset"` | `#closet-body` |
| `feed` | `renderFeed()` | 4699 | `"function renderFeed"` | `#feed-scroll` |
| `explore` | `initExplore()` | 9561 | `"function initExplore"` | `#ex-wrap` |
| `analytics` | `renderAnalytics()` | 5830 | `"function renderAnalytics"` | `#analytics-wrap` |
| `season-recap` | `renderSeasonRecap(getActiveSeason())` | 5558 | `"function renderSeasonRecap"` | `#season-recap-wrap` |
| `outfits` | `initOutfitGen()` | 6142 | `"function initOutfitGen"` | `#og-wrap` |
| `rewards` | `renderRewards()` | 6724 | `"function renderRewards"` | `#rw-wrap` |
| `wallet` | `renderWallet()` | 6795 | `"function renderWallet"` | `#wl-wrap` (see ⚠ below) |
| `agents` | `renderAgents()` | 6877 | `"function renderAgents"` | `#agents-wrap` |
| `sustainability` | `renderSustainability()` | 6970 | `"function renderSustainability"` | `#sus-wrap` |
| `marketplace` | `renderMarketplace()` | 7157 | `"function renderMarketplace"` | `#mp-wrap` |
| `publicclosets` | `renderPublicClosets()` | 8835 | `"function renderPublicClosets"` | `#pc-wrap` |
| `seasonal` | `renderSeasonalReport()` | 8921 | `"function renderSeasonalReport"` | `#sr-wrap` |
| `wishlist` | `renderWishlist()` | 9085 | `"function renderWishlist"` | `#wl-list` |
| `chat` | `initChat()` | 9172 | `"function initChat"` | `#chat-messages` |
| `dm` | `renderDM()` | 9325 | `"function renderDM("` | `#dm-outer` (list ~9330 / thread ~9393) |
| `admin` | `renderAdminDashboard()` | 10871 | `"function renderAdminDashboard"` | `#adm-wrap` |
| `stylists` | `renderStylistMarketplace()` | 10949 | `"function renderStylistMarketplace"` | `#styl-wrap` |
| `shopping` | `initShoppingFeed()` | 11086 | `"function initShoppingFeed"` | `#shopping` section |
| `compare` | `initCompare()` | 11160 | `"function initCompare"` | `#cmp-wrap` |
| `user-profile` | `renderUserProfile()` | 11416 | `"function renderUserProfile"` | `#up-wrap` |

⚠ **Duplicate id gotcha:** both the wallet section (~L2745) and wishlist section (~L2866) contain a `<div id="wl-wrap">`. `getElementById` returns the wallet one (first in DOM); wishlist renders into `#wl-list` instead. Don't add a third.

---

## Adding a New View — 5 steps

1. **Add HTML section** (inside `<main>`, before `</main>` ~L2957):
   ```html
   <section id="myview" class="view">
     <div class="mv-wrap" id="mv-wrap"></div>
   </section>
   ```
2. **Add routing** inside `showView()` (`grep -n "function showView"`):
   ```js
   if (name === 'myview') renderMyView();
   ```
   Also add a title to `VIEW_TITLES` (~L3123 — `grep -n "const VIEW_TITLES"`).
3. **Add entry point** — either a nav button (`<button data-view="myview">`, only 5 slots) or an `onclick="showView('myview')"` chip (see the home quick-actions row — `grep -n "hq-btn"`).
4. **Write the render function** near related features (see Render Function Pattern). Declare any new global `const`/`let` in the TDZ-safe zone (below), not next to the function.
5. **Add i18n keys** to `static/i18n/en.json` + `static/i18n/he.json`, then verify: `showView('myview')` in console actually renders.

---

## Render Function Pattern

```js
function renderFoo() {
  const wardrobe = loadWardrobe();            // 1. Load state via helpers
  const items = wardrobe.filter(i => i.category === 'top');  // 2. Derive
  document.getElementById('foo-wrap').innerHTML = `           // 3. Inject
    <div class="foo-header">${t('foo.title')}</div>
    ${items.map(item => `
      <div class="foo-card" data-id="${attr(item.id)}">${esc(item.name)}</div>
    `).join('')}
  `;
  document.querySelectorAll('.foo-card').forEach(card =>      // 4. Listeners AFTER innerHTML
    card.addEventListener('click', () => handleFooClick(card.dataset.id)));
}
```

**Always** `esc()` for user-visible values, `attr()` for attribute values. **Never** `innerHTML +=` — replace the full target at once.

**Event delegation:** ~108 `data-action` attributes exist; larger views (marketplace, sheets) use one delegated listener reading `dataset.action` — `grep -n "dataset.action"`. Follow the existing pattern of the view you're editing.

---

## i18n — ~L3058–3110 — `grep -n "function t(\|applyStaticI18n\|let LOCALE"`

```js
t('home.greeting_morning')        // simple key      — t() defined ~L3075
t('home.look_n', {n: 3})          // {n} substitution
<span data-i18n="nav.closet">     // static markup — applyStaticI18n() (~L3091) fills at startup
```

New strings go in **both** `static/i18n/en.json` and `static/i18n/he.json`. `t()` fails loud — returns the key itself if missing, never blank. `LOCALE` (~L3058): `'en'` default, `'he'` opt-in, persisted as `awear_locale`; RTL applied automatically.

---

## State — localStorage Helpers — ~L4150–4171 — `grep -n "const WARDROBE_KEY"`

Never touch localStorage directly — use the helpers:

```js
loadWardrobe()  / saveWardrobe(arr)    // awear_wardrobe — clothing items
loadProfile()   / saveProfile(obj)     // awear_profile — {name, handle, city, bio, photo}
loadMeta()      / saveMeta(obj)        // awear_meta
loadShelf()     / saveShelf(arr)       // awear_shelf — resale listings
loadFeedPosts() / saveFeedPosts(arr)   // awear_feed
loadLastScan()  / saveLastScan(v)      // awear_lastscan
ls.load('key')  / ls.save('key', v)    // raw JSON helper (~L4155) for new keys
loadSet(k) / saveSet(k, s)             // Set persistence (~L4574) — likes/follows
```

Other keys in the wild: `awear_credits` (CREDITS_KEY), `awear_locale`, `awear_feed_style_filter`, `awear_wallet_seeded` — grep `"awear_"` before inventing a key.

**Clothing item shape** (from `ClothingItem` in app.py): `{category: 'top'|'bottoms'|'dress'|'outerwear'|'shoes'|'bag'|'accessory', name, color, price_estimate_usd, wear_count, search_query, buy_options: [...]}`

---

## Global const/let Order — TDZ Safety Map

Declarations execute top-to-bottom. `showView('feed')` fires at startup (~L5021), so **everything `renderFeed()` touches must be declared above ~L5021** — and anything used by `showView` itself above ~L3316.

| ~Lines | What's declared | Grep anchor |
|--------|----------------|-------------|
| 3058–3110 | `LOCALE`, `STRINGS`, `t()`, `applyStaticI18n()` | `"let LOCALE"` |
| 3115–3119 | DOM refs: `fileInput`, `closetBody`, `modal`, `modalCard`, `mainEl` | `"const fileInput"` |
| 3123 | `VIEW_TITLES` | `"const VIEW_TITLES"` |
| 3134–3240 | `ICONS`, `icon()`, `CAT_ICON`, `CAT_LABEL` | `"const ICONS"` |
| 3304–3305 | `esc()`, `attr()` | `"function esc("` |
| 3357–3504 | `sheetOverlay`, `STORE_LOGOS`, `AFF_RETAILERS`, `COMPLEMENTS` | `"const sheetOverlay"` |
| 4150–4171 | storage keys + load/save helpers | `"const WARDROBE_KEY"` |
| 4183 | `profileTab` (let) | `"let profileTab"` |
| 4314–11740 | render/init functions (hoisted — safe anywhere) | — |

**Safe zone for a new global constant:** right after the localStorage helpers (~L4171–4195), before `renderCloset()`. **Never** declare a `const`/`let` below ~L5021 that startup rendering references. `function` declarations hoist; `const`/`let` do not. (See `js-tzdead-zone` skill.)

---

## Key Helpers Reference

| Helper | ~Line | Grep pattern |
|--------|-------|--------------|
| `esc(s)` / `attr(s)` — HTML escaping | 3304 | `"function esc("` |
| `t(key, vars?)` — i18n lookup | 3075 | `"function t("` |
| `icon(name, size)` — SVG icon (ICONS has 40+) | 3215 | `"function icon("` |
| `showView(name)` — navigate | 3316 | `"function showView"` |
| `showToast(msg)` — toast notification | 4852 | `"function showToast"` |
| `openSheetSingle` / `openSheetItem` / `openSheetLook` / `closeSheet` — buy bottom sheet | 3439–3816 | `"function openSheet"` |
| `storeLogo(name)` — retailer wordmark/monogram | 3388 | `"function storeLogo"` |
| `getActiveSeason()` — for season-recap | 5548 | `"function getActiveSeason"` |
