# Critique Cycle 1 — Steve | 19.06.2026

## Data Integrity

### products.json
- 65 מוצרים, 65 IDs ייחודיים — ללא כפילויות
- כל 5 שדות חובה קיימים בכל רשומה: `name`, `brand`, `category`, `price_estimate_usd`, `image_url`
- שדות נוספים שנמצאו: `color`, `in_stock`, `search_query`, `tags` — תוספות לגיטימיות, לא בעיה
- image URLs: כל 3 samples שנבדקו הם Unsplash עם פורמט תקין (`https://images.unsplash.com/...?auto=format&fit=crop&w=600&q=80`)
- **ממצא קריטי:** `price_estimate_ils` — לא קיים בקובץ (שינוי שם הושלם בשכבת הdata)

### profiles.json
- 20 פרופילים, 20 IDs ייחודיים
- **ממצא P1 — field naming mismatch:** הקובץ משתמש ב-`followers` ו-`following` (מספרים ישירים). הבדיקה שלנו על `followers_count` / `following_count` החזירה "כל 20 חסרים" — כי השדות קיימים אבל בשם שונה.
  - `followers_count` לא קיים ב-profiles.json
  - `following_count` לא קיים ב-profiles.json
  - הקובץ כולל: `followers: 4320`, `following: 512`
  - אם index.html מצפה ל-`followers_count` — ישבור בשקט. אם מצפה ל-`followers` — תקין.
  - **נדרש grep ב-index.html על `followers_count` לפני שמכריזים clean.**
- avatar URLs: randomuser.me — פורמט תקין, אבל CDN חיצוני. אין SLA. לתשומת לב עתידית.

### posts.json
- 40 פוסטים, 40 IDs ייחודיים
- 20 users ייחודיים — cross-reference עם profiles.json: 0 orphans. כל `user_id` בפוסטים קיים ב-profiles.
- שדות: `caption`, `comments`, `created_at`, `id`, `image_url`, `items_tagged`, `likes`, `user_id` — schema נראה שלם
- image URLs: Unsplash עם aspect ratio 600x750 (portrait) — תואם feed fashion

### cross-data concern
- `posts.json` תקין. `profiles.json` תקין. **אבל:** index.html משתמש ב-`SEED_POSTS` hardcoded (7 פוסטים, schema שונה: `user`, `name`, `price`, `img`) — לא ב-`posts.json`. **data files אינם מחוברים ל-UI.**

---

## Tokens.css Health

### ספירה
- 16 שורות עם hex values — **כולן הגדרות variable עצמן** (`:root { --accent: #e8526a; }`)
- אין hardcoded hex שמשמש כ-fallback לא-תקין. כל hex הוא ערך של token, לא שימוש ישיר בקוד UI

### מבנה
- `tokens.css` — 100 שורות, מבנה נקי: Color, Gradient, Spacing, Border Radius, Typography, Font Families, Shadow, Motion, Z-index
- `awear-tokens.json` — 62 tokens, 9 קטגוריות. **consistency עם CSS: מאומת.** `grad-shine`, `overlay` — קיימים בשניהם.

### בעיה ב-adoption (OW-005 / DS-001)
- `var(--t-` בindex.html: **0 שימושים** (typography tokens)
- `var(--` בindex.html: **372 שימושים** — חלק מהם tokens, אבל:
- hardcoded hex ב-index.html: **159 מופעים**
- tokens.css מוגדר וטוב. הבעיה היא שindex.html כותב hex ישיר ולא צורך את ה-tokens.

### CSS fallback
- DS-004: tokens.css נטען כ-external file. אין `:root` fallback ב-index.html. אם tokens.css נכשל בטעינה — 159 hex values לא מושפעים, אבל 372 `var()` references יפלו.

---

## Static File Serving

### מה קיים
- `app.mount("/static", StaticFiles(directory="static"), name="static")` — שורה 596 ב-app.py
- כלומר: `/static/data/products.json` נגיש דרך HTTP — **תשתית תקינה**

### הבעיה: אף אחד לא קורא לזה
- index.html **לא מכיל אף fetch ל-`/static/data/`**
- `products.json`, `profiles.json`, `posts.json` — **קיימים ב-disk, נגישים ב-HTTP, לא בשימוש**
- הנתונים שה-UI משתמש בהם הם:
  - פוסטים: `SEED_POSTS` hardcoded (7 פוסטים, schema שונה)
  - מוצרים: לא נמצא load — כנראה מגיעים מ-`/api/analyze` (computer vision)
  - פרופילים: לא נמצא load — localStorage בלבד (`awear_wardrobe` etc.)

### מסקנה
data files נוצרו, אך ה-integration loop לא נסגר. `posts.json` (40 פוסטים) ו-`profiles.json` (20 פרופילים) מוכנים לשימוש — אך index.html ממשיך לעבוד עם SEED_POSTS ממוקדים מקומית. זו לא בעיה של serving — זו בעיה של wire-up.

---

## P0 | P1 | P2

### P0 — חוסם

ללא P0 פונקציונלי — האפליקציה רצה, data files קיימים, serving תקין.

**אם הכוונה הייתה לחבר data files ל-UI (assumption שצריך אישור):**
- P0: index.html לא קורא ל-products.json / posts.json / profiles.json — 3 קבצים שנוצרו הם dead weight

### P1 — משמעותי

1. **data files לא מחוברים לUI** — 65 מוצרים, 40 פוסטים, 20 פרופילים קיימים ב-disk אך לא מוצגים. SEED_POSTS (7 פוסטים hardcoded) הוא מה שהמשתמש רואה. **מבחינת product value — Cycle 1 לא הוסיף תוכן לאפליקציה.**

2. **profiles.json field naming** — שדות `followers` / `following` (לא `followers_count` / `following_count`). אם יהיה wire-up עתידי ל-index.html שמצפה לסופית שונה — יישבר בשקט. צריך לנרמל schema עכשיו, לפני שנבנה UI מעליו.

3. **159 hardcoded hex values ב-index.html** — 0 typography tokens בשימוש. tokens.css מוגדר מצוין, לא נצרך. DS-001 חוזר.

### P2 — לטפל בcycle הבא

1. **avatar URLs מ-randomuser.me** — CDN חיצוני ללא SLA. בstorage הייצור צריך S3/CDN פנימי. לא דחוף, אבל רשום.

2. **SEED_POSTS schema שונה מ-posts.json** — `user`, `name`, `price`, `img` vs `user_id`, `caption`, `likes`, `image_url`. כשיהיה wire-up — יצטרכו migration או adapter.

3. **tokens.css — CSS fallbacks חסרים** — DS-004. אם tokens.css נכשל בטעינה, 372 `var()` references נשברים. הוסף `:root` fallback ב-index.html עצמו לצבעי core.

4. **`var(--t-` = 0** — typography tokens לא בשימוש. כל font-size ב-index.html הוא hardcoded. P2 כי לא שובר — אבל ה-OW-005 metric צריך לעלות.

---

## GOOD

1. **products.json — data quality גבוהה.** 65 מוצרים, 0 כפילויות, 0 שדות חסרים, URLs תקינים עם Unsplash params עקביים. מי שבנה את זה עשה עבודה שיטתית.

2. **posts.json cross-reference נקי.** כל 40 `user_id` קיימים ב-profiles. referential integrity נשמר ידנית — זה לא מובן מאליו.

3. **tokens.css — ארכיטקטורה נכונה.** 9 קטגוריות, naming convention עקבי, JSON כ-source of truth, CSS כ-output. הכיוון נכון. הבעיה היא adoption, לא הגדרה.

4. **StaticFiles mount** — `app.mount("/static", ...)` קיים ועובד. כשיהיה wire-up — ה-serving כבר שם. אין עבודת infrastructure נוספת.

5. **price_estimate_ils לא קיים ב-products.json.** BE-001 הוחל על שכבת הdata. הכלל פעל.

---

## מה בתהליך לא תפס את זה? (MG-005 self-check)

data files נוצרו ללא definition-of-done שכלל "connected to UI". הסיבה: לא היה AC (acceptance criteria) שאמר "לאחר יצירת products.json — fetch מ-index.html". זה לא כשל של הסוכן שכתב את הJSON — זה כשל של dispatch שלא הגדיר את שלב ה-integration כחלק מהמשימה.

**פעולה:** הוסף ל-dispatch template: "data file נוצר = P1 open עד שיש fetch מ-index.html שמציג אותו."

---

סטטוס: הושלם
