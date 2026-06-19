> ⚠️ **מסמך זה הוחלף.** ה-authority הוא **[docs/VISUAL_VISION.md](VISUAL_VISION.md)** — Design Master Plan (חלק ו׳).
> קובץ זה נשמר כ-reference לרשימת החלפות emoji ספציפיות.

# AWEAR — Icon System [ARCHIVED]
**גרסה: 1.0 | תאריך: 19.06.2026 | כותב: מארק (Head of Design)**

---

## החלטה: Icon Library שנבחרה

### Lucide Icons — הנבחרת

**קישור:** https://lucide.dev
**CDN (vanilla JS / HTML):**
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

### נימוק הבחירה

| קריטריון | Lucide | Heroicons | Phosphor | Feather |
|----------|--------|-----------|----------|---------|
| מספר icons | 1,700+ | ~300 | 7,700+ | 480 |
| Stroke weight | 1.5–2px, configurable | 1.5px (outline) | 6 weights | 2px fixed |
| חבילת CDN | קיים, עובד בvanilla JS | npm בלבד עיקרי | npm בלבד | legacy |
| עדכונים פעילים | כן (fork של Feather) | כן (Tailwind) | כן | לא (מוקפא) |
| style | Modern, clean, 24px grid | Minimal, refined | Most versatile | Original minimal |
| התאמה ל-AWEAR | גבוהה — fashion + social = clean lines | גבוהה | גבוהה מדי — יותר מדי variants | לא פעיל |

**מדוע Lucide ולא Phosphor:** Phosphor מצוין אבל מיועד לframeworks (React/Vue). AWEAR web (`static/index.html`) היא vanilla JS. Lucide מציע CDN מוכן לשימוש עם `lucide.createIcons()` — zero config.

**מדוע Lucide ולא Heroicons:** Heroicons מצמצם את ה-set ל-300 icons, שלא מכסה כמה icons ספציפיים שAWEAR צריכה (hanger, sparkle, hoodie). Lucide מכסה הכל.

**הערה חשובה:** AWEAR כבר יש מערכת icon function (`icon(name, size)`) עם custom SVG paths inline. המעבר ל-Lucide אינו חייב להיות all-or-nothing. ראה "אסטרטגיית מיגרציה" בסוף המסמך.

---

## אסטרטגיית מיגרציה: Hybrid (מומלצת)

AWEAR כבר מיישמת icon system מקצועי עם inline SVG ב-`ICONS` object. הicons הקיימים:
- מצוירים ידנית על grid 24×24
- stroke-width: 1.8 (קרוב מאד ל-Lucide's 1.5–2)
- `stroke="currentColor"` — יורשים צבע מההורה
- כוסו בפונקציה `icon(name, size)` עם fallback ל-tag

**הבעיה האמיתית אינה ב-icon system — היא ב-emoji שעוקפות אותו.**

### מה להחליף (P0 — Dolce):
כל מקום שבו emoji משמש כUI element (ולא כתוכן משתמש).

### מה לשמר:
הפונקציה `icon(name, size)` + `ICONS` object. הם תקינים ועקביים. אין צורך לטעון Lucide CDN רק בשביל icons שכבר קיימים.

### מה להוסיף:
אם בעתיד דולצ'ה צריכה icon שאינו ב-`ICONS` — מוסיפה ל-object עם SVG path מ-Lucide.dev (העתקה של ה-path strings). לא טוענת CDN שלם.

---

## טבלת החלפות: Emoji → SVG Icon

### UI Chrome (P0 — לא מותר בשום מצב)

| מיקום בקוד | Emoji הנוכחי | icon() להחליף | הערה |
|-----------|-------------|-------------|------|
| `.sf-tab` "בשבילך" | `✨` | `icon('sparkle', 16)` | קיים ב-ICONS |
| `.sf-tab` "Trending" | `🔥` | `icon('flame', 16)` | קיים ב-ICONS |
| `.sf-tab` "חסר לך" | `🎯` | `icon('sparkle', 16)` או `icon('leaf', 16)` | sparkle = "מיוחד לך" |
| `.hq-btn` Outfit AI | `✨` | `icon('sparkle', 15)` | קיים ב-ICONS |
| `.hq-btn` Marketplace | `🛒` | `icon('bag', 15)` | קיים ב-ICONS |
| `.mp-title` Marketplace | `🛒` | `icon('bag', 18)` | קיים ב-ICONS |
| `.an-sec-title` "לפי קטגוריה" | `👗` | `icon('hanger', 16)` | קיים ב-ICONS |
| `.an-sec-title` "הכי נלבש" | `🔥` | `icon('flame', 16)` | קיים ב-ICONS |
| `.sr-sec-title` "הכי נלבש בעונה" | `🔥` | `icon('flame', 16)` | קיים ב-ICONS |
| `.wl-empty-icon` | `💭` | `icon('bookmark', 44)` | ריק state של wishlist |
| מרכז ה-camera view | `📸 סרקי לוק ראשון` | `icon('camera', 24)` + טקסט | הbutton עצמו שומר טקסט |
| CTA נקודות (rewards) | `📸` `✨` `💬` `🛒` | icon('camera') icon('sparkle') icon('share') icon('bag') | array `home-quests` |
| `.cmp-slot-empty-icon` | `👗` | `icon('hanger', 32)` | empty closet slot |
| `og-loading-spinner` | `✨` | CSS spinner בלבד (כבר קיים `.spinner` class) | לא emoji |
| closet empty state | `👗✨` (font-size:64px) | `icon('hanger', 60)` בצבע accent2 | empty state hero |
| `שאלי את אביגיל` | `💬` | `icon('share', 18)` לא מתאים — להשתמש ב`chat` icon חדש | הוסיפי icon 'chat' ל-ICONS |

### CAT_EMOJI — פונקציה לביטול

**נוכחי (שורה 1598):**
```javascript
const CAT_EMOJI = {top:'👕',bottoms:'👖',dress:'👗',outerwear:'🧥',shoes:'👟',bag:'👜',accessory:'💍',jewelry:'💎',hat:'🧢'};
```

**להחליף ב:** הפונקציה `catIcon(cat)` כבר קיימת ומחזירה שם icon. `CAT_EMOJI` לא בשימוש בUI chrome לאחר migration. לבדוק אם יש קריאות שנשארו ל-`CAT_EMOJI` ולהחליף ב-`catIcon()`.

**שורות ספציפיות לתשומת לב (קריאות ל-CAT_EMOJI בUI):**
- שורה 3268: `const CAT_EMOJIS = {...}` ב-listing form — להחליף category selector בicon SVG.
- שורה 3963: `it.emoji||CAT_EMOJI[it.category]||'👗'` — להחליף ב-`productImage(it)` שכבר עושה fallback נכון.
- שורה 3218: `${item.emoji||'👗'}` ב-marketplace card — להחליף ב-`productImage(item)`.

### User avatars — emoji בוצע בטעות

| מיקום | emoji | החלפה |
|-------|-------|--------|
| sellers (שורות 3344–3349): `avatar:'🌸'`, `avatar:'🖤'`, `avatar:'🦋'` | emoji כavatar | CSS avatar circle עם initials, לא emoji |
| `cover:'👗✨💕'` בseller card | emoji כcover image | productImage() או gradient כ-fallback |

---

## הנחיות שימוש — כללים לדולצ'ה

### גדלים (3 מצבים בלבד)

| גודל | שימוש | דוגמה |
|------|-------|--------|
| **20px** | ברירת מחדל. icons בתוך טקסט, בתוך metadata | `icon('tag', 20)` ב-card label |
| **24px** | icons עצמאיים, action buttons, navigation | `icon('heart', 24)` ב-feed actions |
| **28px** | icons בכותרות סעיפים, section titles | `icon('hanger', 28)` ב-shelf title |

גדלים חריגים (60px, 44px, 40px) — מותרים רק ב-empty states ו-hero placeholders. לא בUI chrome רגיל.

### Stroke Weight

**אחיד: 1.8px (הערך הנוכחי ב-`icon()` function).**

לא לשנות ל-2px, לא ל-1.5px. 1.8px = מאוזן בין Lucide (1.5) לFeather (2). מתאים ל-AWEAR's dark mode.

### Color Inheritance

כל icon מוכרח לרשת צבע מהוריו:
```css
stroke="currentColor"  /* חובה */
fill="none"            /* ברירת מחדל */
```

**יוצאי דן:** icons עם fill (heartFill, bookmarkFill, more) — fill="currentColor" + stroke="none". מוגדרים כבר ב-ICONS object.

### Hit Targets (WCAG AA)

כל icon שמשמש כbutton חייב hit target של 44×44px לפחות.
- ה-icon עצמו יכול להיות 24px.
- הcontainer/button חייב להיות 44×44px.

**דוגמה נכונה:**
```css
.fca-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
/* icon בפנים: 24px — אבל tap area = 44px */
```

### Semantic Accessibility

```html
<!-- icon בלבד (decorative) -->
<span aria-hidden="true">icon('heart', 24)</span>

<!-- icon כbutton עם פעולה -->
<button aria-label="שמרי לוק" onclick="...">
  <span aria-hidden="true">icon('bookmark', 24)</span>
</button>
```

---

## Icons שחסרים ב-ICONS Object — להוסיף

| שם | שימוש | SVG Path (Lucide) |
|----|-------|-------------------|
| `chat` | Stylist chat CTA, comments | `<path d="M14 9a3 3 0 0 1-3 3H6l-4 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4z"/>` |
| `bell` | Notifications (עתידי) | `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>` |
| `eye` | View count | `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>` |
| `refresh` | רענון / rescan | `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>` |

**הוראה לדולצ'ה:** הוספת icon חדש ל-`ICONS` object = הדרך היחידה לhוסיף icon. אין ליצור emoji חדש. אם הSVG path לא ברור — קחי מ-lucide.dev (לחצי על icon → Copy SVG path).

---

## כיצד לטעון Lucide ב-static/index.html (אם נדרש בעתיד)

אם בעתיד מוחלטים לעבור לLucide CDN מלא (לא מומלץ בשלב זה — ICONS object מספיק):

```html
<!-- הוסיפי בתוך <head>, לאחר fonts.googleapis.com -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

**שימוש בHTML:**
```html
<i data-lucide="heart" class="icon-action"></i>
```

**Initialization (בסוף <body> לאחר כל ה-HTML):**
```javascript
lucide.createIcons();
```

**CSS לגדלים:**
```css
[data-lucide] { width: 24px; height: 24px; stroke-width: 1.8; stroke: currentColor; fill: none; }
.icon-sm [data-lucide] { width: 20px; height: 20px; }
.icon-lg [data-lucide] { width: 28px; height: 28px; }
```

**עם זאת — המלצת מארק לcycle הנוכחי:** לא לטעון Lucide CDN. AWEAR כבר יש icon system עובד. הבעיה היא emoji שעוקפים אותו, לא חוסר בלibrary. נפתור את הemoji problem קודם, ואז נעריך אם CDN נדרש.

---

## Checklist לדולצ'ה לפני PR

- [ ] אפס emoji ב-UI chrome (grep: `grep -n "'[👗👖👟🛒✨🔥🎯📸💭💬]'" static/index.html | grep -v "//\|user-content\|reply\|greeting"`)
- [ ] כל `CAT_EMOJI` הוחלפו ב-`catIcon()` + `icon()`
- [ ] seller avatars: לא emoji — CSS initials circle
- [ ] כל icon בbutton: hit target ≥ 44×44px
- [ ] stroke-width: 1.8 אחיד בכל SVG חדש
- [ ] `aria-hidden="true"` על כל icon decorative
- [ ] `aria-label` על כל icon-only button

---

*מסמך זה מחליף כל הנחיה icon קודמת.*
*קיים גם ב: `docs/DESIGN_STANDARDS.md` סעיף "אייקונים".*
*שאלות → מארק. ביצוע → דולצ'ה. QA → גבאנה.*
*אושר: מארק (Head of Design) | 19.06.2026*
