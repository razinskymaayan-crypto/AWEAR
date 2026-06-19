# Marketplace — Product Spec

**סטטוס:** Draft — ממתין לאישור לפני dispatch
**תאריך:** 2026-06-19
**owner spec:** איילון | Product Director

---

## מה זה

מסך קנייה/מכירה בתוך הקהילה. משתמש יכול לפרסם פריטים מהמלתחה שלו למכירה, לגלוש בפריטים של אחרים, ולצפות ברכישות שלו.

**ה"עבודה" שהמוצר שוכר:** ביטחון שמישהי קנתה מהאוסף שלי — לא חדר מלאי.

---

## Tabs

| Tab | שם | ברירת מחדל |
|-----|----|------------|
| 1 | גלול (Browse) | כן — פריטים מכל המשתמשים, sort=Newest |
| 2 | שלי (My Listings) | פריטים שהמשתמש מוכר (active listings) |
| 3 | רכישות (Purchases) | מה שקניתי — היסטוריה |

**הכרעה (Cycle 2 roadmap, 2026-06-19):** tabs לפי status. sort default=Newest.
**למה לא tabs לפי category:** מלאי קטן ב-bootstrap — tabs ריקים שוברים ציפייה. status tabs יראו מלאים גם ב-10 פריטים.

---

## Tab 1: גלול (Browse)

### Sort
- Default: Newest (created_at DESC)
- שינוי sort: dropdown — Newest / Price Low / Price High
- לא מרחק — location data לא קיים. Cycle 3.

### Filters
- קטגוריה (multi-select chip row): הכל / נעליים / מכנסיים / חולצות / ג'קטים / אקססוריז / שמלות
- מידה: XS / S / M / L / XL (multi-select)
- מחיר: slider מ-0 עד 500 (יחידה: $)
- filter state נשמר ב-localStorage תחת key `mkt_filters`

### כרטיס פריט (Listing Card) — לפי R-001
| אלמנט | פירוט |
|-------|-------|
| תמונה | 4:5 aspect-ratio, productImage() — לא gradient |
| שם פריט | --t-body, שורה אחת, truncate |
| מחיר | `$XX` — var(--accent), --t-lead |
| condition badge | שלושה ערכים: New / Like New / Good — chip קטן מעל התמונה |
| size badge | XS–XL — ליד condition |
| seller handle | @username, --t-small, var(--muted) |
| heart button | icon('heart', 18) — toggle like. IP-based ב-MVP, user-based Cycle 3 |

**מדוע condition badge חובה:** R-001 מציין זאת כ-gap מפורש. משתמשת לא תלחץ "קני" בלי לדעת מצב הפריט — זה ה-job-to-be-done של הbadge.

---

## Tab 2: שלי (My Listings)

### כרטיס listing פעיל
| אלמנט | פירוט |
|-------|-------|
| תמונה | מ-Wardrobe (newImageUri מ-Camera flow) |
| מחיר | כפי שהוזן |
| condition | כפי שנבחר |
| ימים פרסום | "X days ago" — created_at |
| views count | מופיע רק אם > 0 — לא מספרים מומצאים |
| CTA: ערכי | פותח Sell Form עם פרטים מולאים |
| CTA: הסירי | מחיקה עם confirmation dialog ("האם להסיר את הפריט?") — פעולה הפיכה Cycle 3, כרגע permanent |

**הגבלה:** views count = Cycle 3. ב-MVP מוצג רק אם backend מחזיר ערך > 0. לא מציגים אפס.

---

## Sell Form

פותח כ-bottom sheet מעל הסמלון "+" ב-My Listings tab.

| שדה | סוג | validation |
|-----|-----|------------|
| פריט | בחירה מ-Wardrobe (dropdown) | חובה |
| מחיר | number input | > 0, מספר בלבד, max 9999 |
| condition | select: New / Like New / Good | חובה |
| מידה | select: XS/S/M/L/XL | חובה |
| תיאור | textarea | אופציונלי, max 200 תווים |

**CTA:** "פרסמי" — לא "שמרי". המחשבה תמיד מנקודת מבט הקונה.
**שגיאות:** inline, לא toast. כל שדה חובה מציג שגיאה ברדיוס המגע שלו.

---

## Tab 3: רכישות (Purchases)

### MVP scope
- רשימת כרטיסים בסדר כרונולוגי (newest first)
- כרטיס: תמונה + שם פריט + מחיר + תאריך רכישה + seller handle
- Empty state: "עוד לא קנית כלום — גלולי בפריטים" עם CTA → Tab 1

**מחוץ ל-scope MVP:** מצב הזמנה / tracking / החזרות / ביקורות מוכר.

---

## שאלות פתוחות — לפני dispatch

### תשלום
- Stripe? PayPal? ארנק פנימי?
- **החלטה:** מחוץ לscope MVP. Cycle 1–2 = listing בלבד, אין עסקה אמיתית. כפתור "קני" מוביל ל-"צור קשר עם המוכר" (message flow) — Cycle 3.
- **סיכון:** משתמשת שמגיעה לכפתור "קני" ורואה "צור קשר" תרגיש שהמוצר שבור. **הפחתה:** copy ברור מהרגע הראשון — "מרקטפלייס קהילתי — תיצרי קשר עם המוכר ישירות".

### shipping
- טיפול ידני ב-Cycle 1–2.
- **החלטה:** לא מוצגת אפשרות shipping מובנית. seller מוסיפה פרטים ב-תיאור (textarea חופשי).

### location
- location data לא קיים.
- **החלטה:** sort "קרוב אלי" לא זמין. Cycle 3 — אחרי שיש user.location בprofile.

---

## Data source — Cycle 2

| מקור | שימוש |
|------|-------|
| static/data/products.json | 65 פריטים ב-6 קטגוריות — הבסיס לbrowse |
| static/data/profiles.json | seller handle + avatar |
| in-memory _listings_store | פריטים שפורסמו ב-Sell Form (session בלבד ב-MVP) |

**חוב ידוע:** _listings_store אינו persistent. רענון דף מאבד listings. Cycle 3 — POST /api/listings endpoint + schema.

---

## Definition of Done — Cycle 2

| קריטריון | כיצד נבדק |
|---------|-----------|
| שלושת ה-Tabs עוברים switch ללא reload | Playwright: click על כל tab, assert active state |
| גלול מציג מינימום 6 כרטיסי פריטים מ-products.json | Playwright: count listing-card ≥ 6 |
| condition badge מופיע על כל כרטיס | grep listing-card HTML, assert badge |
| Sell Form נפתח ומאפשר הזנת מחיר + condition + מידה | Playwright: fill form, submit, assert card ב-My Listings |
| sort Newest מסדר לפי created_at DESC | test: הוסף 2 פריטים, ודא שהחדש ראשון |
| filter קטגוריה מסנן תוצאות | Playwright: בחר "נעליים", assert שרק shoes מוצגות |
| Empty state ב-Purchases | Playwright: assert empty state text |

**לא חלק מ-DoD MVP:** תשלום, shipping, persistence, views count.

---

## היררכיית scope לפי Cycles

| Cycle | scope |
|-------|-------|
| 2 | listing display + Sell Form + Tabs + static data |
| 3 | POST /api/listings (persistent) + message flow + user-based likes |
| 4 | תשלום (Stripe/PayPal) + shipping + ביקורות מוכר |

---

## הערת Product — למה Marketplace ב-Cycle 2 ולא Cycle 3

**הסתירה:** cycle_2_product_roadmap.md לא כולל Marketplace כ-P0 או P1 — הוכרעה שאלת tabs בלבד ב-"שאלות פתוחות". הspec הזה מפרט מסך שטרם שובץ ב-Cycle.

**המלצה:** לדון בBoard Sync הבא האם Marketplace נכנס כ-P1 ל-Cycle 2 (בהנחה שdolce פנויה לאחר skeleton+chips) או שנשמר לCycle 3.
**הסיכון בדחייה:** Tab Bar מ-Cycle 2 כולל "Marketplace" כ-tab — tab שמוביל לריק הוא חוויה שבורה. אם Tab Bar יוצא ב-Cycle 2, Marketplace stub חייב להתלוות אליו.
**הצעה:** Marketplace stub (Tab + static data, ללא Sell Form) = P1 Cycle 2. Sell Form = P0 Cycle 3.

---

*Ayalon | Product Director | AWEAR | 2026-06-19*
