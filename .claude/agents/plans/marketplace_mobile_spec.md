# Marketplace — Mobile Screen Spec (Cycle 2)

**screen:** MarketplaceScreen.js (Roei's domain)
**scope:** browse stub, static data, NO sell form
**worktree:** /Users/tamargrosz/roei-marketplace

---

## החלטות ארכיטקטורה (MB-002 — חובה לפני dispatch)

**Navigation stack:** Tab.Navigator קיים (feat/react-navigation-install, commit 0e15041). Marketplace יתווסף כ-Tab.Screen נוסף — לא stack חדש. שם route: `'Marketplace'`.

**State management:** AppContext קיים (AppProvider + useApp hook, commit b33ae8c). MarketplaceScreen ישתמש ב-useState מקומי לבלבד (selectedCategory, products). אין צורך ב-AppContext extension בCycle 2 — static data, אין persistence.

---

## Layout

ScrollView חיצוני עם:
1. Header: "Marketplace" (t('marketplace.title')) + search icon (icon('search', 20)) — ללא פונקציונליות חיפוש בCycle 2
2. Filter row: Category chips, גלילה אופקית (ScrollView horizontal) — אותו סגנון כמו Feed chips לפי spec איילון
3. ProductGrid: FlatList עם numColumns={2}

---

## ProductCard (per grid cell)

| אלמנט | פירוט |
|-------|-------|
| image | item.image_url — Image component עם aspectRatio: 4/5 (לפי R-001 masonry ratio) |
| שם פריט | item.name — var(--t-body), שורה אחת, numberOfLines={1} |
| מחיר | `$${item.price_usd}` — var(--accent), var(--t-lead) |
| condition badge | item.condition — chip מעל התמונה. צבעים לפי design token: like-new=var(--success), good=var(--accent2), fair=var(--muted) |
| heart icon | icon('heart', 18) — toggle, useState מקומי, uncontrolled (persistence = Cycle 3) |

**touch target:** כל כרטיס ≥44px בגובה (R-001, smashingmagazine tap targets).

**condition badge — ערכים מותרים:** `"like-new"` / `"good"` / `"fair"` בלבד. ערך אחר = badge לא מוצג (לא crash).

---

## Filter Row — Category Chips

קטגוריות לפי products.json: הכל / נעליים / מכנסיים / חולצות / ג'קטים / אקססוריז / שמלות

- בחירה בודדת (single-select, לא multi-select — Cycle 3)
- chip active: background var(--accent), text var(--fg)
- chip inactive: background var(--card), text var(--muted)
- state: useState מקומי (`selectedCategory`)
- filter לוגיקה: `products.filter(p => selectedCategory === 'all' || p.category === selectedCategory)`

---

## Data source

**Primary:** `GET http://localhost:8000/api/products?limit=50`

schema צפוי מה-endpoint (לפי סאם, commit 8305516):
```json
{ "items": [...], "total": 65, "limit": 50, "offset": 0 }
```

mapping: `data.items || data` (fallback לarray ישיר — OW-001, תאימות אחורה).

**Fallback (error / offline):** empty state עם text t('marketplace.empty').

**אין fallback לstatic file ישיר** — לא לטעון products.json ישירות ב-mobile. כל data = דרך API.

---

## i18n keys נדרשים (en/he)

יש להוסיף ל-`mobile/i18n/en.json` ו-`mobile/i18n/he.json`:

```json
"marketplace": {
  "title": "Marketplace",
  "search": "Search",
  "empty": "No items yet",
  "condition": {
    "likenew": "Like New",
    "good": "Good",
    "fair": "Fair"
  }
}
```

```json
"marketplace": {
  "title": "מרקטפלייס",
  "search": "חיפוש",
  "empty": "אין פריטים עדיין",
  "condition": {
    "likenew": "כמו חדש",
    "good": "טוב",
    "fair": "סביר"
  }
}
```

כל string דרך t() — אפס hardcoded עברית/אנגלית ב-JSX (MB-003).

---

## Tab Bar integration

Tab.Screen להוסיף ב-App.js (לפי react_navigation_plan.md):
- name: `'Marketplace'`
- component: `MarketplaceScreen`
- icon: `icon('bag', 22)` — active: var(--accent), inactive: var(--muted) (לפי מארק, commit ב-mark log)

---

## DoD

| קריטריון | כיצד נבדק |
|---------|-----------|
| FlatList מציגה ≥3 products מAPI | Metro bundle + visual check: 3 כרטיסים מוצגים בmain view |
| 2-column grid ב-390px (iPhone 14 standard) | Metro — numColumns=2 נראה |
| condition badge צבוע לפי token | visual check: like-new=ירוק, good=accent2, fair=muted |
| error state קיים | נתק API → empty state text מוצג (t('marketplace.empty')) |
| כל copy דרך t() | grep Hebrew strings ב-MarketplaceScreen.js = 0 |
| אין emoji ב-UI chrome | grep emoji characters ב-MarketplaceScreen.js = 0 (DS-006) |
| heart icon toggle | לחיצה → icon state משתנה (uncontrolled) |

---

## מחוץ לscope Cycle 2 — רשימה מפורשת

- Sell Form / My Listings / Purchases tabs
- חיפוש פונקציונלי
- filter מרובה בחירות
- persistence של heart/favorites
- sort dropdown
- POST /api/listings
- תשלום, shipping, views count

---

## next step

רועי מממש MarketplaceScreen.js אחרי שFeedScreen API integration יושלם (P1 Cycle 2).

**תנאי dispatch:** FeedScreen מחובר ל-API (commit קיים) + Tab.Screen של Marketplace נוסף ל-App.js.

**חסם ידוע:** expo-image-manipulator תלות — לא רלוונטית למסך זה. אין חסמים mobile-specific לMarketplace.

---

*וראן | Mobile Developer | AWEAR | 2026-06-19*
*סטטוס: הושלם — ממתין לdispatch לרועי*
