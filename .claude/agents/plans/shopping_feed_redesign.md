> ⚠️ הפניות במסמך זה ל-DESIGN_STANDARDS התיישנו — המקור העדכני: docs/VISUAL_VISION.md. תוכנית אב: .claude/master/MASTER_PLAN.md.

# Shopping Feed — Web Redesign Brief

**תאריך:** 2026-06-19
**מאת:** מארק (Head of Design)
**עבור:** דולצ'ה (ביצוע), גבאנה (QA)
**הקשר:** DESIGN_STANDARDS עודכן. Shopping Feed הוא מסך P0 לצמיחה — אין עוד הצדקה לפיגור ויזואלי.

---

## הבעיה הנוכחית

ממצאים ישירים מהקוד:

**1. sf-card-img — image placeholder פעיל**
שורה 903: `font-size: var(--t-display,52px)` על container תמונת המוצר. ה-binding ל-`productImage()` קיים (שורה 5034), אבל CSS ה-`sf-card-img` גם נמצא במצב merge conflict פתוח (שורות 899–905 — `<<<<<<< HEAD` / `=======` / `>>>>>>> feat/typography-migration`). conflict לא נפתר — שתי גרסאות בו-זמנית בקובץ. זה P0 בפני עצמו.

**2. sf-grid — gap לא עקבי**
שורה 896: `gap:12px`. התקן בWEAR (כלל 5, רשת 8pt) = 8px בין cards. 12px תקין גם (נמצא בסקאלה), אבל במסך ברוחב 390px עם 2 עמודות — 12px gap דוחס את הcards. 8px מוכיח עצמו ב-ASOS ו-Depop כ-sweet spot.

**3. sf-tabs — active state = background fill**
שורה 895: `.sf-tab.active { background:var(--accent); border-color:var(--accent); color:#fff; }` — pill filled. Depop, ASOS, Vinted — כולם משתמשים ב-underline indicator לtabs, לא pill. pill מתאים ל-filter chips, לא ל-navigation tabs בתוך מסך. ראה R-001.

**4. sf-card-img — height קבועה במקום aspect-ratio**
שורה 900: `height:140px` — fixed px. לא מגיב לשינויי container. product images מ-Unsplash/Pexels בproportion 4:5 ייחתכו. aspect-ratio עקבי = תמונות שנראות מעוצבות, לא חתוכות.

**5. sf-card-body — padding לא על רשת**
שורה 909: `padding:10px 12px 12px`. 10px לא ב-8pt grid. צריך 8px 12px 12px.

**6. sf-badge.new + sf-discount — hardcoded hex**
שורות 907–908: `background:#4ade80` ו-`background:#f59e0b` — צבעים מחוץ ל-token system (כלל 3, DESIGN_STANDARDS). tokens קיימים: `var(--success)` ו-`var(--warning)`.

**7. מחיר ₪0**
שורה 5041: `₪${it.price}` ללא guard. אם `price = 0` או `price = null` — מוצג `₪0` למשתמש. לא acceptable.

---

## מה Shopping Feed צריך להרגיש כמו

**ASOS browse — מה עושה אותו טוב:**
- grid 2-col עם תמונות product clean (לבן/רקע בהיר) — הבגד עצמו מדבר
- info row תחת התמונה: שם מותג bold, מחיר, ובדיוק זה — אין עודף
- filter tabs underline בלבד, minimal — הניווט לא מתחרה בתמונות
- badge condition (New In) קטן, non-intrusive — בפינה, לא מכסה תמונה

**Depop listings — מה עושה אותו טוב:**
- תמונות 4:5 portrait ratio — בגדים נראים natural, לא ריבועיים
- seller handle מופיע תחת מחיר — trust signal קריטי לsecondhand
- condition badge subtle על הimage (not fullscreen overlay) — מיקום top-right בלי gradient
- tab bar עם underline 2px — active state ברור בלי להשתלט על הנדל"ן

שניהם: הcard עצמו הוא הUX. אין decorations. תמונה, שם, מחיר, seller — זה הכל.

---

## Layout changes

- **Grid:** 2-column על mobile (390px), gap 8px
- **sf-card:** border-radius 16px, overflow hidden
- **sf-card-img:** aspect-ratio 4/5, object-fit cover — לא height fixed
- **sf-card-info:** (שם חדש לsf-card-body) padding 8px 12px

---

## Typography ב-sf-card

- **שם מוצר:** `var(--t-h3)`, `var(--w-heavy)` — (15px, 800) — קריא ב-2 עמודות
- **מחיר:** `var(--t-lead)`, `var(--w-black)`, color: `var(--text)` — (17px, 900) — הדגשה ברורה
- **condition badge:** `var(--t-micro)`, background: `var(--success-surface)` לNew/Like-new / `var(--warning-surface)` לGood/Fair
- **seller:** `var(--t-small)`, color: `var(--muted)` — (13px) — secondary, לא מתחרה במחיר

---

## Tabs redesign (Shopping Feed sub-tabs)

- **active tab:** border-bottom 2px solid `var(--accent)` — לא background fill
- **inactive tab:** border: none, background: transparent
- **min-height:** 44px (כלל 4 — tap target)
- **font:** `var(--t-small)`, active: color `var(--accent)` + `var(--w-heavy)`, inactive: color `var(--muted)` + `var(--w-semibold)`
- **gap בין tabs:** 8px, overflow-x: auto, scrollbar-width: none (נשאר כמו שהיה)
- **padding:** 0 18px — הtabs נשארים aligned לsf-grid

---

## Filter chips (לעתיד — Cycle 3)

placeholder — spec נפרד ב-`agents/plans/style_chips_spec.md`.
Filter chips = horizontal scroll מתחת לtabs, לא חלק מהtabs עצמם.

---

## What NOT to do

- אין gradient overlay על תמונת מוצר (gradient = מסתיר בגד, לא מציג אותו)
- אין emoji בtab labels — icons בלבד דרך `icon()` (DS-006)
- אין מחיר `₪0` — הסתר sf-price-row אם `price = 0` או `price = null`
- אין `height: 140px` fixed על sf-card-img — aspect-ratio בלבד
- אין `background:#4ade80` / `background:#f59e0b` — רק `var(--success)` / `var(--warning)`
- אין conflict markers בקוד (`<<<<<<<`, `=======`, `>>>>>>>`) — resolve לפני כל דבר אחר

---

## DoD לDolce

לפני שגבאנה פותחת QA — self-check על כל סעיף:

1. **merge conflict resolved** — שורות 899–905 ב-index.html: conflict מ-`feat/typography-migration` נפתר. גרסה אחת. אין `<<<<<<< HEAD`.
2. **sf-grid gap = 8px** — שורה 896: `gap:8px` (היה 12px)
3. **sf-card border-radius = 16px** — שורה 897: `border-radius:16px` (היה 18px)
4. **sf-card-img = aspect-ratio 4/5** — אין `height:140px`. `aspect-ratio:4/5`, `overflow:hidden`.
5. **sf-card-body padding = 8px 12px** — אין `10px` (off-grid)
6. **typography tokens בלבד** — `grep "font-size" static/index.html | grep "sf-card"` = 0 hardcoded px
7. **tabs = underline indicator** — `.sf-tab.active` = `border-bottom: 2px solid var(--accent)`, אין `background:var(--accent)`
8. **badge tokens** — `#4ade80` → `var(--success)`, `#f59e0b` → `var(--warning)` בsf-badge context
9. **price guard** — sf-card render: `it.price && it.price > 0` לפני הצגת sf-price-row

---

## גבאנה — QA checklist

1. `grep "<<<<<<\|=======\|>>>>>>>" static/index.html` = 0
2. `grep "sf-card-img" static/index.html | grep "height:14"` = 0 (אין fixed height)
3. `grep "sf-tab.active" static/index.html | grep "background:var(--accent)"` = 0 (אין pill fill)
4. `grep "font-size" static/index.html | grep -v "var(--t-" | grep -i "sf-card"` = 0
5. `grep "#4ade80\|#f59e0b" static/index.html | grep "sf-badge"` = 0
6. שאלת העל: פתח Shopping Feed, scroll 2 cards — "האם screenshot זה יעלה ב-Instagram story של AWEAR?"
