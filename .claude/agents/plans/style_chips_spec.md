# Style Filter Chips — Product Spec

**Author:** Ayalon (Product Director)
**Date:** 2026-06-19
**Owner לביצוע:** דולצ'ה
**Priority:** P1 — cycle הבא
**מקור:** critique_cycle_1_ayalon.md → gap analysis; UX research R-001 (filter chips horizontal scroll)

---

## הבעיה

אין דרך לצמצם פיד לסגנון מועדף. כל user רואה הכל.

משתמשת שנכנסת לפיד ביום ראשון, ללא following קיים, רואה פיד שנראה random — לא מחובר לסגנון שלה. אין שום ידית שתאפשר לה לסנן ל-Y2K, Minimal, Vintage — הסגנון שהיא באה לראות. זה retention killer ביום 1.

הפער הטכני: `activeFilter` logic קיים בקוד. ה-UI chips לא קיימות מעל הפיד. זה UI-only — לא חסם backend.

---

## הפתרון

Horizontal scrollable chip row בראש הפיד.

---

## מיפוי מדויק Chip → style_tag

**מקור הנתונים:** הסינון עובד דרך `profiles.style_tags` — הקוד ב-loadFeedData() (index.html שורה 2275) ממפה כל פוסט לstyletags של הuser שפרסם אותו: `const tags = (user.style_tags || []).map(t => t.toLowerCase())`. הסינון לאחר מכן: `seeds.filter(p => (p.tags||[]).includes(activeFilter))`.

**לכן: ערכי הchip חייבים להתאים לערכי profiles.style_tags אחרי toLowerCase().**

| Chip (UI label) | style_tag בposts — ערך מדויק לסינון | הערה |
|----------------|--------------------------------------|-------|
| הכל | (ללא filter — `activeFilter='all'`) | ברירת מחדל |
| Minimal | `minimal` | |
| Streetwear | `streetwear` | |
| Vintage | `vintage` | |
| Y2K | `y2k` | בפועל ב-profiles: `"Y2K"` — הקוד עושה toLowerCase() כך שהסינון צריך `y2k` |
| Luxury | `luxury` | |
| Sporty | `sporty` | |
| Boho | `boho` | |
| Dark Academia | `dark academia` | **שים לב: רווח, לא underscore.** בפועל ב-profiles: `"dark academia"`. אחרי toLowerCase() = `"dark academia"`. ערך שגוי: `dark_academia` ישבור את הסינון. |

**ערכים קיימים בprofiles שלא מקבלים chip (מחוץ לscope בינתיים):** `cottagecore`, `avant-garde`. פוסטים של users עם tags אלה יראו רק תחת "הכל".

## Chips — הגדרה מלאה

| Chip | style_tag תואם | הערה |
|------|---------------|-------|
| הכל | (ללא filter) | ברירת מחדל |
| Minimal | `minimal` | |
| Streetwear | `streetwear` | |
| Vintage | `vintage` | |
| Y2K | `y2k` | |
| Luxury | `luxury` | |
| Sporty | `sporty` | |
| Boho | `boho` | |
| Dark Academia | `dark academia` | רווח — לא underscore |

סדר: "הכל" תמיד ראשון, שאר הchips לפי פופולריות (ניתן לשנות בהמשך לפי analytics — לא בscope עכשיו).

---

## Behavior

**לחיצה על chip:**
- chip לא פעיל → הופך פעיל, פיד מסונן לפי style_tag
- chip פעיל → מבטל, חוזר לboolean "הכל"
- "הכל" → תמיד מבטל כל filter

**Multi-select:** מותר. משתמשת יכולה לבחור "Minimal + Vintage" ולראות פוסטים שמתאימים לאחד מהשניים (OR logic, לא AND). AND היה מצמצם יתר על המידה את הפיד.

**ברירת מחדל:** "הכל" — פיד מלא, ללא filter. זו ברירת המחדל הנכונה כי:
- משתמשת חדשה לא יודעת עדיין מה מועדף עליה
- AWEAR בשלב bootstrap צריכה exposure מקסימלי

**Persistence:** selection נשמרת ב-localStorage כך שחזרה לאפליקציה שומרת את הpreference. לא Session storage — היא חוזרת מחר ורוצה לראות Vintage כמו שהשאירה.

localStorage key: `awear_feed_style_filter` — array של style_tags.

---

## Filter logic — הגדרה

פוסט עובר את ה-filter אם:

```
selectedChips = [] (הכל) → הצג הכל
selectedChips = ['minimal', 'vintage'] → הצג פוסטים שיש להם לפחות אחד מהtags האלה
```

מיפוי: `post.tags` — כפי שנמפה ב-loadFeedData() מ-`user.style_tags` של הprofile. posts.json עצמו לא מכיל style_tags — הsource of truth הוא profiles.json. אם לפוסט אין tags (user ללא style_tags בprofile) — מופיע תמיד (לא מוסתר על ידי filter). זה מונע מפוסטים ישנים / ללא tag לנעלם מהפיד.

---

## עיצוב

**מיקום:** מעל feed-scroll, מתחת ל-header/nav. sticky אם הפיד scrollable (כך הchips נשארים גלויים בזמן גלילה).

**ה-chip עצמו:**
- inactive: `background: var(--card)`, `color: var(--text-2)`, border: `1px solid var(--card-border)` (אם קיים) או `var(--surface)`
- active: `background: var(--accent)`, `color: var(--on-accent)` או equivalent token
- border-radius: pill (24px+ — לא ריבועי)
- padding: 8px 16px (רשת 8pt)
- font-size: `var(--t-sm)` (לא hardcoded)
- tap target: לפחות 44px גובה (לפי R-001)

**Horizontal scroll:** `overflow-x: auto`, `white-space: nowrap`, `::-webkit-scrollbar { display: none }` — scrollbar מוסתר, scroll אפשרי.

**לא להוסיף emoji לchips.** כלל DS-006. chips הם טקסט.

---

## definition of done

- chips גלויים בראש Shopping Feed מעל feed-scroll
- "הכל" chip נבחר כברירת מחדל בload
- לחיצה על chip → פיד מסונן בפועל לפי style_tags (לא רק visual change)
- multi-select עובד: בחירת שני chips → פיד מציג union
- "הכל" מבטל כל selection
- localStorage persistence: filter נשמר בין sessions
- פוסטים ללא style_tags מוצגים תמיד (לא מסוננים החוצה)
- chip active state: visual ברור שנבחר (צבע, לא רק underline)
- horizontal scroll עובד במובייל ללא scrollbar גלוי
- tokens בלבד — אין hex values בCSS של chips
- Playwright test: בחירת chip → כרטיסים שלא תואמים style_tag לא מוצגים

---

## מה לא בscope

- AND logic בין chips (Minimal AND Vintage) — הפוסטים כאלה מעטים מדי בשלב bootstrap
- personalization / ranking chips לפי activity של המשתמשת — cycle 3+
- chips בmarketplace (יש שם כבר category filters — לא מבלבלים עם system שני)
- animation של chips (spring / bounce) — P2 לאחר שה-UI עובד

---

## נקודת כשל עיקרית

filter chips שעובדות ויזואלית אבל לא מסננות בפועל. זה הכשל הצפוי: chip נראה נבחר, פיד לא משתנה — כי החיבור ל-activeFilter logic לא הושלם. דולצ'ה: בדקי את החיבור לפני שמסמנים done. הכלל מ-OW-002 תקף כאן — "הושלם" = filter עובד בפועל, לא "chip נראה טוב".

---

*Ayalon | Product Director | AWEAR | 2026-06-19*
