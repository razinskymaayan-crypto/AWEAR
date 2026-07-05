# SPA Patterns & Helpers — static/index.html (reference for spa-navigation)

Detail behind `SKILL.md` (which holds the file zones + view map). Line numbers verified
2026-07-05 against 11,754 lines — they drift; the grep pattern is the truth.

## Adding a New View — 5 steps

1. **Add HTML section** (inside `<main>`, before `</main>` — `grep -n "</main>"`):
   ```html
   <section id="myview" class="view">
     <div class="mv-wrap" id="mv-wrap"></div>
   </section>
   ```
2. **Add routing** inside `showView()` (`grep -n "function showView"`):
   ```js
   if (name === 'myview') renderMyView();
   ```
   Also add a title to `VIEW_TITLES` (`grep -n "const VIEW_TITLES"`).
3. **Add entry point** — either a nav button (`<button data-view="myview">`, only 5 slots) or an `onclick="showView('myview')"` chip (see the home quick-actions row — `grep -n "hq-btn"`).
4. **Write the render function** near related features (see Render Function Pattern). Declare any new global `const`/`let` in the TDZ-safe zone (see SKILL.md), not next to the function.
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

## i18n — `grep -n "function t(\|applyStaticI18n\|let LOCALE"`

```js
t('home.greeting_morning')        // simple key      — t() defined ~L3075
t('home.look_n', {n: 3})          // {n} substitution
<span data-i18n="nav.closet">     // static markup — applyStaticI18n() (~L3091) fills at startup
```

New strings go in **both** `static/i18n/en.json` and `static/i18n/he.json`. `t()` fails loud — returns the key itself if missing, never blank. `LOCALE` (~L3058): `'en'` default, `'he'` opt-in, persisted as `awear_locale`; RTL applied automatically.

---

## State — localStorage Helpers — `grep -n "const WARDROBE_KEY"` (~L4150–4171)

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

## Global const/let Order — TDZ Declaration Map

Declarations execute top-to-bottom. `showView('feed')` fires at startup (`grep -n "Auto-render feed on load"`, ~L5020), so **everything `renderFeed()` touches must be declared above that line** — and anything used by `showView` itself above its definition (~L3316).

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

**Safe zone for a new global constant:** right after the localStorage helpers (after `grep -n "const WARDROBE_KEY"` block, before `renderCloset()`). **Never** declare a `const`/`let` below the startup-render line that startup rendering references. `function` declarations hoist; `const`/`let` do not. (See `js-tzdead-zone` skill.)

---

## Key Helpers Reference

| Helper | ~Line | Grep pattern |
|--------|-------|--------------|
| `esc(s)` / `attr(s)` — HTML escaping | 3304 | `"function esc("` |
| `t(key, vars?)` — i18n lookup | 3075 | `"function t("` |
| `icon(name, size)` — SVG icon (ICONS has ~67 entries) | 3215 | `"function icon("` |
| `showView(name)` — navigate | 3316 | `"function showView"` |
| `showToast(msg)` — toast notification | 4852 | `"function showToast"` |
| `openSheetSingle` / `openSheetItem` / `openSheetLook` / `closeSheet` — buy bottom sheet | 3439–3816 | `"function openSheet"` |
| `storeLogo(name)` — retailer wordmark/monogram | 3388 | `"function storeLogo"` |
| `getActiveSeason()` — for season-recap | 5548 | `"function getActiveSeason"` |
