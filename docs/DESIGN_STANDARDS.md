> ⚠️ **מסמך זה הוחלף.** ה-authority הוא **[docs/VISUAL_VISION.md](VISUAL_VISION.md)** — Design Master Plan שמכיל הכל.
> קובץ זה נשמר כ-reference היסטורי בלבד.

# AWEAR — תקני עיצוב (Design Standards) [ARCHIVED]

## העיקרון העליון
**"האם זה היה עולה לאוויר בחברת מוצר מובילה (Instagram / Pinterest / Zara)?"**
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

### כלל 4 — typography scale בלבד — אין גדלים אחרים
אין hardcoded `font-size` — רק `var(--t-*)`.
- **פקודת אימות post-migration:** `grep "font-size" static/index.html | grep -v "var(--t-"` = 0.
- **בינתיים (עד migration):** כל PR חדש שמוסיף `font-size` שלא ב-scale — חסום.
- **tokens (שמות נכונים):** `--t-micro:11px` | `--t-caption:12px` | `--t-small:13px` | `--t-body:14px` | `--t-h3:15px` | `--t-lead:17px` | `--t-h2:18px` | `--t-title:20px` | `--t-h1:24px` | `--t-display:32px`
- **אזהרה:** `--t-sm`, `--t-md`, `--t-lg` — לא קיימים. שימוש בהם שבירה שקטה.

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
- זו לא subjectivity — זו הסטנדרט. Instagram/Pinterest/Zara עולות עם תוכן אמיתי, scale נכון, אפס placeholder.

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
ה-source of truth הוא `static/tokens.css`. הערכים הנוכחיים המיושמים:
- `--bg:#0e0c0f` · `--surface:#161318` · `--card:#1e1a22` · `--card-hover:#262030`
- `--fg:#f0ecf5` · `--muted:#8a8498` · `--line:#2e2836`
- `--accent:#e8526a` · `--accent2:#c4855a` · `--accent3:#7a6af0`
- `--success:#52c97a` · `--warning:#e8a84a` · `--danger:#e05252`

**Light mode** — auto לפי מכשיר (החלטת board 19.06.2026). ראה `docs/VISUAL_VISION.md` לערכים המתוכננים לCycle 3.
**פלטה עתידית (Cycle 3):** מעבר ל-terracotta/camel — ראה `docs/VISUAL_VISION.md` למפרט המלא.
בלי צבעים מחוץ ל-tokens. אין edit ידני של `tokens.css` — רק דרך `awear-tokens.json`.

## טיפוגרפיה
- **Headlines (EN):** DM Serif Display — editorial voice, אלגנטי.
- **Body + labels:** Inter (EN) | Heebo (עברית, RTL).
- **מחירים ומספרים:** Poppins — precision, tabular feel.
- סקאלה: 10 גדלים, tokens בלבד — `--t-micro` עד `--t-display`. בלי גדלים אקראיים.
- משקלים: 400 (DM Serif) / 400–500 (Inter) / 600 (Poppins numbers). אין 700+ בגוף טקסט.
- **tokens בשמות הנכונים:** `var(--t-micro)` / `var(--t-caption)` / `var(--t-small)` / `var(--t-body)` / `var(--t-h3)` / `var(--t-lead)` / `var(--t-h2)` / `var(--t-title)` / `var(--t-h1)` / `var(--t-display)`

## מרווחים ופריסה
- רשת 8pt: 4 / 8 / 12 / 16 / 24 / 32px. **tokens:** `--space-1` עד `--space-6`.
- רדיוסים: `--r-xs:6px` / `--r-sm:10px` / `--r-md:14px` / `--r-lg:20px` / `--r-xl:28px` / `--r-pill:999px`.
- **Grid:** 2 עמודות לfeed ו-wardrobe. 3 עמודות לprofile בלבד.
- **Aspect ratio:** 4:5 portrait לכל product/outfit card. 1:1 לprofile thumbnails.
- מסגרת מובייל `.phone` 390px, RTL מלא. כל מסך — פעולה ראשית אחת ברורה.

## אייקונים
- מערכת אחת (`icon(name)` שמחזיר inline SVG). משקל קו אחיד (~1.8). יורש צבע מההורה.
- אייקון בתוך כפתור: אייקון+טקסט במרכז עם `gap`. מצבי `:active` ו-`on` (למשל לב מלא בלייק פעיל).

## תמונות מוצר
- מקור אמיתי לפי `search_query` של הפריט. תמיד `loading="lazy"` + `onerror` ל-fallback מעוצב.
- מראה "cutout" נקי (רקע בהיר) — כמו אתר מכירה.
- **אין `emoji` field כ-display** — `search_query` בלבד.

## תנועה
- **Tap feedback:** 80ms — `scale(0.96) + opacity 0.85`. מיידי, מרגיש responsive.
- **Card open / screen transition:** 260–320ms, spring physics (לא linear easing).
- **Pull-to-refresh:** bounce — exaggerated spring.
- **עיקרון:** תנועה מספרת מידע, לא מקשטת. אין parallax, אין fade-in decorative.
- `:active` CSS state חובה לכל `<button>` ו-`onclick`. minimum: `scale(0.97) opacity(0.75)`.

## Definition of Done (לפני מסירה)
- [ ] אין אימוג'י מקלדת ב-UI; כל האייקונים SVG אחידים (`grep "item.emoji\|\.qo-emoji\|\.tc-emoji" index.html` = 0).
- [ ] כל בגד/מוצר = תמונה אמיתית + fallback SVG נקי.
- [ ] tokens, סקאלת טיפוגרפיה, ורשת 8pt נשמרים (`grep "#2a2040\|#1a1030" index.html` = 0).
- [ ] empty / loading / error states מטופלים ומזמינים.
- [ ] RTL נכון, ניגודיות AA, יעדי מגע ≥44px, `:active` feedback לכל אינטראקציה.
- [ ] **שאלת העל:** "היה עולה ב-Instagram story של AWEAR?" — גבאנה עונה בפועל, לא מסמנת checkbox.
- [ ] `Visual QA: עבר שאלת העל` — שורה זו חייבת להופיע בתגובת גבאנה לכל PR.

---

*עודכן: 19.06.2026 (v2) — visual vision approved by board. מאשר: ג'ף (CEO), מארק (Head of Design).*
*לחזון המלא: `docs/VISUAL_VISION.md`*
