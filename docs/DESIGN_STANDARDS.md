# Awear — תקני עיצוב (Design Standards)

המסמך הזה הוא ה-single source of truth לעיצוב Awear. **Dolce** (ראש העיצוב) מעצב לפיו, **Gabbana** (מבקר) אוכף אותו, וכל שינוי ויזואלי נמדד מולו לפני מסירה למייסדים. אם משהו באפליקציה סותר את המסמך — זה באג עיצובי שצריך לתקן, גם אם לא ביקשו.

## העיקרון העליון
**"האם זה היה עולה לאוויר בחברת מוצר מובילה (Instagram / Linear / Depop / Apple)?"**
אם לא — לא מוסרים. עדיף לאחר במסירה מאשר למסור בינוניות.

---

## 7 כללי Instagram — "AWEAR נראה כמו רשת חברתית מובילה"
*נוספו בישיבת מנהלים 19.06.2026 — תוצאה של תחקיר design crisis*
*כל כלל כולל פקודת אימות — גבאנה מריצה לפני כל merge*

### כלל 1 — אפס emoji ב-UI chrome
אימוג'י אסורים בניווט, cards, כפתורים, badges, section labels, status indicators.
- **פקודת אימות:** `grep -n "emoji\|\.qo-emoji\|\.tc-emoji\|\.ex-result-emoji\|\.rw-perk-icon" static/index.html` + בדיקה ויזואלית שכל character unicode שמוצג כ-UI element הוחלף ב-SVG.
- **מותר:** emoji בתוכן שמשתמש כתב בעצמו (כיתוב פוסט, תגובה).
- **לא מותר:** `font-size: 52px` בתוך container של מוצר — זה emoji placeholder, לא עיצוב.

### כלל 2 — כל product card = תמונה אמיתית
`mp-item-img`, `sf-card-img`, `ex-result-emoji`, `wl-item-ico`, `pc-feat-cover` — כולם מציגים `productImage()` עם `<img src="...">` אמיתי.
- **פקודת אימות:** `grep "item.emoji\|\.emoji\|'👗'\|'👖'\|'👟'" static/index.html | grep -v "//\|user-content"` חייב להחזיר 0 ב-product render contexts.
- **fallback מותר:** אייקון SVG נקי של בגד. לא gradient. לא ריבוע ריק. לא character.
- **data requirement:** כל פריט ב-`marketplace[]`, `feed[]`, `closet[]` — חייב `search_query` string, לא `emoji` field כ-display default.

### כלל 3 — background = token, לא hex
`#2a2040` ו-`#1a1030` לא קיימים ב-`awear-tokens.json` — הם hallucinated colors. כל surface חייב להשתמש ב-token.
- **פקודת אימות:** `grep -c "#2a2040\|#1a1030" static/index.html` = 0.
- **מיפוי:** `#2a2040` → `var(--card)` | `#1a1030` → `var(--bg2)` | gradients על surfaces → `linear-gradient(var(--bg2), var(--card))`.
- **כלל כללי:** כל `background:` שאינו `var(--*)` או gradient של tokens קיימים — P0.

### כלל 4 — typography scale של 5 גדלים בלבד
11 / 13 / 15 / 19 / 26px. אין גדלים אחרים. אין hardcoded `font-size` — רק `var(--t-*)`.
- **פקודת אימות post-migration:** `grep "font-size" static/index.html | grep -v "var(--t-"` = 0.
- **בינתיים (עד migration):** כל PR חדש שמוסיף `font-size` שלא ב-scale — חסום.
- **tokens:** `--t-xs: 11px` | `--t-sm: 13px` | `--t-md: 15px` | `--t-lg: 19px` | `--t-xl: 26px`.

### כלל 5 — רשת 8pt
כל `padding`, `margin`, `gap` = כפולה של 4px מהרשימה: 4 / 8 / 12 / 16 / 24 / 32px.
- ערך שלא ברשימה דורש הסבר מפורש ב-PR description.
- ברירת מחדל בספק: עגל ל-8pt הקרוב.
- רדיוסים: 10 / 16 / 22px לפי היררכיה (chip / card / modal).

### כלל 6 — כל אינטראקציה = feedback
כל `<button>`, כל element עם `onclick`, כל card שניתן ללחוץ — חייב `:active` CSS state.
- **פקודת אימות:** `grep -c "onclick" static/index.html` מול `grep -c ":active" static/index.html` — הפער הוא חוב. כל PR חדש עם `onclick` ללא `:active` — חסום.
- **סטנדרט:** `:active { opacity: 0.75; transform: scale(0.97); }` כ-minimum. מותר יותר עשיר.

### כלל 7 — שאלת העל בפועל (לא checkbox)
לפני כל merge של PR עיצובי: גבאנה פותחת את המסך ושואלת:
**"אם AWEAR הייתה מפרסמת screenshot מהמסך הזה ב-Instagram story של הברנד — האם הייתה מתביישת?"**
- אם כן — חוסמת. מגיבה עם: מה בדיוק לא עובר, ומה צריך להשתנות.
- כל PR שגבאנה חותמת עליו כולל שורה: `Visual QA: עבר שאלת העל / לא עבר — [סיבה]`.
- זו לא subjectivity — זו הסטנדרט. Instagram/TikTok/Pinterest עולות עם תוכן אמיתי, scale נכון, אפס placeholder.

---

## קווים אדומים (פסילה אוטומטית — P0)
1. אימוג'י מקלדת כאלמנט UI — אייקון, כפתור, ניווט, סטטוס, badge. לעולם לא.
   אייקונים = inline SVG מעוצב אחיד, `stroke/fill="currentColor"`, `viewBox 0 0 24 24`, סגנון Lucide/Phosphor.
   (אימוג'י מותר רק בתוך **תוכן משתמש** — כיתוב פוסט שמשתמשת כתבה — לא ב-chrome.)
2. ייצוג מוצר/בגד באימוג'י או placeholder — בגד הוא **תמיד** תמונת מוצר אמיתית, עם fallback מעוצב (אייקון בגד נקי, לא ריבוע ריק/תמונה שבורה).
3. תוכן/מספרים "mockup" גלויים שנראים מזויפים. אם צריך מספרי דמו — שיגזרו מ-data.
4. טיפוגרפיה בלי סקאלה, ניגודיות מתחת ל-WCAG AA, יעדי מגע <44px, תנועה מקרטעת.
5. **חדש 19.06.2026** — hex colors שאינם tokens (`#2a2040`, `#1a1030`, וכל hex שאינו ב-`awear-tokens.json`).
6. **חדש 19.06.2026** — `emoji` field כ-display default ב-data objects של מוצרים.

## Design Tokens (להשתמש בהם בלבד)
- צבעים: `--bg #0a0a0e` · `--bg2 #111118` · `--card #17171f` · `--line #24242e` · `--text #f6f6f9` · `--muted #8e8e9c` · `--accent #ff3d77` (ורוד) · `--accent2 #7b5cff` (סגול).
- פעולה ראשית = גרדיאנט `accent→accent2`. בלי צבעים מומצאים מחוץ ל-tokens.
- **אכיפה:** `scripts/build-tokens.js` מייצר את `tokens.css` מ-`awear-tokens.json`. אין edit ידני של `tokens.css`.

## טיפוגרפיה
- גופנים: Heebo (גוף, עברית), Poppins (לוגו/מספרים בלבד).
- סקאלה: 5 גדלים — 11 / 13 / 15 / 19 / 26px. בלי גדלים אקראיים, בלי טקסט מתחת ל-11px.
- משקלים: 600 / 800 / 900 בלבד.
- **tokens:** `var(--t-xs)` / `var(--t-sm)` / `var(--t-md)` / `var(--t-lg)` / `var(--t-xl)` — בלבד.

## מרווחים ופריסה
- רשת 8pt: 4 / 8 / 12 / 16 / 24 / 32px. רדיוסים: 10–16–22px לפי היררכיה.
- מסגרת מובייל `.phone` 390px, RTL מלא. כל מסך — פעולה ראשית אחת ברורה.

## אייקונים
- מערכת אחת (`icon(name)` שמחזיר inline SVG). משקל קו אחיד (~1.8). יורש צבע מההורה.
- אייקון בתוך כפתור: אייקון+טקסט במרכז עם `gap`. מצבי `:active` ו-`on` (למשל לב מלא בלייק פעיל).

## תמונות מוצר
- מקור אמיתי לפי `search_query` של הפריט. תמיד `loading="lazy"` + `onerror` ל-fallback מעוצב.
- מראה "cutout" נקי (רקע בהיר) — כמו אתר מכירה.
- **אין `emoji` field כ-display** — `search_query` בלבד.

## תנועה
- מעברים 150–250ms, easing נעים. `:active` feedback לכל אלמנט אינטראקטיבי. תנועה בעלת מטרה, לא קישוט.

## Definition of Done (לפני מסירה)
- [ ] אין אימוג'י מקלדת ב-UI; כל האייקונים SVG אחידים (`grep "item.emoji\|\.qo-emoji\|\.tc-emoji" index.html` = 0).
- [ ] כל בגד/מוצר = תמונה אמיתית + fallback SVG נקי.
- [ ] tokens, סקאלת טיפוגרפיה, ורשת 8pt נשמרים (`grep "#2a2040\|#1a1030" index.html` = 0).
- [ ] empty / loading / error states מטופלים ומזמינים.
- [ ] RTL נכון, ניגודיות AA, יעדי מגע ≥44px, `:active` feedback לכל אינטראקציה.
- [ ] **שאלת העל:** "היה עולה ב-Instagram story של AWEAR?" — גבאנה עונה בפועל, לא מסמנת checkbox.
- [ ] `Visual QA: עבר שאלת העל` — שורה זו חייבת להופיע בתגובת גבאנה לכל PR.

---

*עודכן: 19.06.2026 — לאחר ישיבת מנהלים design crisis. מאשר: ג'ף (CEO), מארק (Head of Design).*
*גרסה קודמת: 18.06.2026*
