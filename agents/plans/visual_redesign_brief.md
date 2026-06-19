# Visual Redesign Brief — Cycle 2

**תאריך:** 2026-06-19
**מאת:** מארק (Head of Design)
**עבור:** דולצ'ה (ביצוע), גבאנה (QA)
**הקשר:** פידבק דירקטוריון דרך ג'ף — האפליקציה לא נראית מספיק טוב. מחקר הצבעים לא הפך לשינוי ויזואלי מורגש.

---

## הבעיה (מדויק)

ג'ף מסכם את פידבק הדירקטוריון: research קיים, tokens קיימים, אבל המשתמש שפותח את האפליקציה לא רואה שינוי.

מה הקוד מראה בפועל:

1. **body background** (שורה 22): `radial-gradient(140% 100% at 50% 0%, #15131f 0%, #000 70%)` — hardcoded hex שאינם tokens. הרקע של כל הדף הוא hardcoded.
2. **card images** (שורות 779, 899, 1002): `.pc-feat-cover`, `.sf-card-img`, `.mp-item-img` — כולם `font-size: 52px` + gradient. כל כרטיסי מוצר ב-Public Closets, Shopping Feed, ו-Marketplace הם ריבוע gradient ריק שמחכה ל-emoji.
3. **hardcoded dark surfaces** (שורות 103, 163, 358, 417, 1168): `#20202b`, `#191922`, `#1c1c26` — surfaces שנמצאים בפרופיל, listing, edit modal, sheet modal. אלה צבעים שמומצאים מחוץ ל-token system.
4. **phone box-shadow** (שורה 27): `rgba(123,92,255,.28)` — purple glow על ה-shell. הפלטה עברה ל-rose (#e8526a) ב-tokens.css, הglow נשאר purple legacy.
5. **273 hardcoded font-size** — מיגרציית נטה (cycle 2) כיסה 239, עדיין נותרו ~34 שורות עם px ישיר.

---

## 3 שינויים ויזואליים שישנו את האפליקציה הכי הרבה

(לא token infrastructure — שינויים שמשתמש ירגיש ב-5 שניות)

### 1. תמונות מוצר אמיתיות ב-Shopping Feed ו-Marketplace

**מה זה:** שורות 899 + 1002 — `.sf-card-img` ו-`.mp-item-img` מציגים `font-size: 52px` placeholder. כשאין emoji, המשתמש רואה ריבוע gradient ריק.

**מדוע הכי מוחש:** Shopping Feed ו-Marketplace הם שני המסכים שמשתמש רואה ראשונים לאחר הפיד. כל grid card נראה ריק. זה מה שהדירקטוריון ראה.

**מה צריך לקרות:** `productImage()` function קיימת. `search_query` קיים בdata. הbinding חסר. כל product card חייב `<img>` + `onerror` fallback ל-SVG icon נקי. לא gradient. לא emoji.

**היכן:** JS functions שמרנדרות `.sf-card-img` ו-`.mp-item-img` — לא ב-CSS, ב-JS render functions שיוצרות את ה-HTML.

### 2. החלפת box-shadow של ה-phone shell לpalette הנוכחית

**מה זה:** שורה 27 — `box-shadow: 0 30px 80px rgba(123,92,255,.28)`. Purple glow. הפלטה עברה ל-rose (`#e8526a`). כל אדם שפותח את האפליקציה בdesktop/tablet רואה phone frame עם glow שסותר את הpalette.

**מדוע הכי מוחש:** זה הרושם הראשון לפני שגוללים פנימה. token קיים: `--shadow-accent: 0 4px 20px rgba(232,82,106,.32)`. אבל phone shell משתמש בערך ישן.

**שינוי מינימלי:** שורה 27 — להחליף `rgba(123,92,255,.28)` ל-`rgba(232,82,106,.24)`. שינוי שורה אחת, השפעה ויזואלית מיידית על first impression.

### 3. body background — token במקום hardcoded hex

**מה זה:** שורה 22 — `background: radial-gradient(140% 100% at 50% 0%, #15131f 0%, #000 70%)`. הרקע של הדף כולו הוא hardcoded. `#15131f` אינו ב-tokens, קרוב ל-`--surface` (#161318) אך לא זהה.

**מדוע הכי מוחש:** body background נראה בכל breakpoint שבו ה-phone container לא מכסה את כל המסך. בdesktop זה ברור. בmobile זה context שבו background נראה מסביב ל-phone border-radius.

**תיקון:** `radial-gradient(140% 100% at 50% 0%, var(--surface) 0%, var(--bg) 70%)`. תחביר זהה, tokens קיימים.

---

## לDolce — Redesign sprint priority

### P0 (לפני כל דבר אחר — משתמש רואה את זה בשניות 1-5)

**P0-1: Shopping Feed card images**
- `.sf-card-img` (שורה 899) — JS render function שיוצרת את הHTML
- כל `sf-card` חייב `productImage(item)` עם `<img src=...>` + `onerror` fallback ל-`icon('hanger', 32)` על background `var(--card)`
- `font-size: 52px` ב-CSS נשאר כ-fallback alignment אבל ה-`<img>` מכסה אותו

**P0-2: Marketplace card images**
- `.mp-item-img` (שורה 1002) — אותו pattern
- כל marketplace item חייב `productImage(item)` — products.json מכיל `search_query` לכל פריט

**P0-3: Phone shell glow**
- שורה 27: `rgba(123,92,255,.28)` → `rgba(232,82,106,.24)`
- שינוי בודד, אין תלויות

**P0-4: body background**
- שורה 22: `#15131f` → `var(--surface)`, `#000` → `var(--bg)`

### P1 (cycle זה, לאחר P0 cleared)

**P1-1: hardcoded surfaces**
- שורות 103, 163, 358, 417, 1168: `#20202b` → `var(--card-hover)`, `#191922` → `var(--card)`, `#1c1c26` → `var(--surface)`
- בדיקה: ניגודיות WCAG AA לפני merge (DS-005)

**P1-2: .mp-item-badge.like-new**
- שורה 1005: `background: #4ade80` → `var(--success)` (migration נטה כיסה את ה-success token)

**P1-3: .sf-badge.new, .sf-badge.missing, .sf-discount**
- `#4ade80` → `var(--success)`, `#f59e0b` → `var(--warning)`

### P2 (cycle הבא)

- `#fff` color migration (~25-30 הופעות על overlays) — דורש screenshot comparison + גבאנה clearance לפי hex_audit_cycle1.md
- `font-size` שאריות (~34 הופעות שלא כוסו במיגרציית נטה)

---

## גבאנה — checkpoints נדרשים

לכל PR מדולצ'ה ב-P0:
1. grep `font-size: 52px` ב-sf-card-img / mp-item-img context — חייב להיות מכוסה ע"י img
2. grep `rgba(123,92,255` ב-phone shell = 0
3. grep `#15131f\|#000` בbody rule = 0
4. שאלת העל: "screenshot זה יעלה ב-Instagram story של AWEAR?" — חובה לענות בפועל

---

## מה מצליח (לא לגעת)

- **card component** (`.sf-card`, `.mp-item`) — border-radius, gap, :active scale — נכונים
- **gradient CTAs** — accent→accent2 gradient על כפתורים ראשיים — תקין
- **navigation bar** — tokens נכונים, active/inactive states נכונים
- **skeleton loading** — מוכן ותקין מה-cycle הקודם (commit bf6cddd)
- **filter chips** — pattern נכון, token-based
- **tokens.css עצמו** — הpalette Mediterranean Modern אושרה ועוברת WCAG. הבעיה היא שהקוד לא משתמש בה.

---

## סיכום כיוון

הבעיה המרכזית: **יש token system תקין, יש data אמיתית, יש product images — אבל הbinding בין data לrender חסר בשני המסכים הכי גלויים (Shopping Feed + Marketplace), והshell עצמו עדיין מציג palette ישנה.**

שינויי P0 הם שינויי שורות ספורות + binding function. אין ארכיטקטורה חדשה נדרשת. אין spec חדש. הdata קיימת. הcode קיים. המחבר חסר.

**Dolce מתחילה ב-P0-1 (sf-card-img images). גבאנה מבצעת QA לפני כל merge.**
