# AWEAR Sprint Log — until 07:00

## מבנה עבודה
- **איילון** — מונה כ-CPO/Customer Lens: מסתכל מנקודת מבט המשתמשת בכל פגישת חתך
- פגישת חתך: כל 10 דקות
- פגישת אסטרטגיה: כל שעה
- כל מנהל מריץ צוות סוכנים משלו במקביל

## Backlog (לפי עדיפות)
1. Shopping Feed (Recommended/Trending/Missing/Deals)
2. Outfit Inspiration ("% מהלוק כבר בארון שלך")
3. Better onboarding flow fix + polish
4. Admin Dashboard (KPIs)
5. AI Stylist personality upgrade
6. Push notifications stub
7. Share Look to Feed improvements
8. Item detail expanded view

## Sprint Log

---

## ג'ף — 2026-06-17 (Align Day)

**סוג יום:** Align Day — הופעל אחרי שני באגי רינדור רצופים שדרשו ישיבת נזיפה ולמידה משותפת (לא Build Day, יש חסם תהליכי שצריך להיסגר לפני שחוזרים לעבודה עמוקה).

### הושלם היום
- תיקון תקרית 2: `RW_KEY`/`LEVELS` TDZ crash שתקע את מסך הבית — הוזזו ההגדרות לפני `renderHome()`. אומת ב-Playwright headless (לא ניחוש): 0 console errors, `#home-wrap` מתמלא, screenshot מאשר.
- תיקון תקרית 1 (מהיום הקודם): reactions/comments נסתרים בכרטיסי פיד — `position: absolute` + bottom sheet לתגובות במקום inline.
- `agents/postmortem_2026-06-17.md` — ניתוח שורש לשתי התקריות, החלטות, ownership.
- `daily_model.md` — נוסף **Iron Rule #9**: כל commit שמשנה רינדור חייב הרצת דפדפן אמיתי (Playwright) לפני merge, לא רק JS syntax.
- `.claude/skills/verify-rendering/SKILL.md` — project skill קבוע: Playwright מותקן בפרויקט (venv312), דרך מתועדת לבדוק רינדור תוך פחות מ-10 שניות, כדי שכלל #9 יהיה ניתן ליישום בפועל ולא רק על הנייר.

### בתהליך (צפי: מחר)
- אין — Align Day הסתיים עם החלטה ברורה ומנגנון מיושם, לא רק כוונה.

### חסמים פתוחים
- **tokens.css לא מקושר ל-index.html — וזה לא "quick fix".** בדיקה גילתה ש-`--accent`/`--accent2` הפוכים בין הקובץ הקיים (`#ff3d77`/`#7b5cff`) לבין `tokens.css` (`#7b5cff`/`#ff3d77`), וגם `--bg`, `--card`, `--line`, `--muted` שונים. קישור עיוור ישנה את צבעי כל האפליקציה בלי אזהרה. **בעלים: נטה** — צריך migration plan מבוקר (לא flip switch), עם visual diff לפני/אחרי. לא לבצע ב-Build Day הבא בלי אישור.

### מחר — מטרה ראשית
- Build Day. נטה מציגה תוכנית migration ל-tokens.css; שאר הצוות חוזר ל-scope הרגיל (Dana/Roei — RN navigation+camera, Oren — API integration scope מסאם, Shira — moderation).

---

## ג'ף — שבוע 17–23.06.2026 (Build Days, ע"פ הנחיית כרמל: "תריץ שבוע שבסופו הכל עובד")

**הקשר:** כרמל יצא, נתן אישור גורף ("יש לכם אישור שלי להכל עד שאני חוזר") וביקש שבסיום השבוע **הכל יעבוד**, מאומת — לא מוצהר. כל סעיף למטה נבדק בפועל (Playwright headless + curl ל-backend), לא הוסק מקריאת קוד בלבד.

### Day 2 — Full regression audit
- נבנה script שמפעיל את כל 17 ה-views באפליקציה (`showView()` לכל אחד) ובודק console errors + אורך תוכן שעלה בפועל.
- **תוצאה: 0 שגיאות בכל 17 המסכים.** מסכים עם תוכן קטן (analytics, seasonal, compare) אומתו ויזואלית — empty-state תקין עם CTA, לא באג.

### Day 3 — Global pivot, לקיחה שנייה: הבק-אנד תוקן, הפרונט לא
גילוי מרכזי: הפיבוט הגלובלי שכרמל דרש ("האפליקציה לא מיועדת רק לישראל") **תוקן ב-`app.py` בלבד בסשן קודם — לא ב-`static/index.html`.** נמצאו ותוקנו:
- **`AFF_RETAILERS`** (מירור צד-לקוח של `app.py RETAILERS`) — עדיין הכיל Terminal X. הוחלף ל-Depop+ZARA כדי להתאים בדיוק לבק-אנד.
- **הטיית Tel-Aviv מובנית לכל משתמש גלובלי** — header pin קבוע "· תל אביב", weather card קבוע "☀️ תל אביב", ו-`loadProfile()` default + save fallback שמחזירים 'תל אביב' לכל משתמש חדש בעולם. תוקן: city עכשיו ריק כברירת מחדל, pin/weather דינמיים מ-`prof.city`, מתעדכנים אחרי שמירת פרופיל.
- **seed/demo data ישראלי-ספציפי**: פריט תכשיטים עם brand `Terminalx`, caption "לוק קיץ תל אביבי", scenario "בוקר בתל אביב", שאלת onboarding עם אופציית "Terminal X · ישראלי" — כולם הוחלפו לגרסאות גלובליות-נייטרליות.
- regression מלא (17 מסכים) הורץ אחרי כל שינוי — 0 שגיאות.

### Day 4 — tokens.css ו-backend
- **תוקן באג אמיתי במקור (`awear-tokens.json`):** `accent`/`accent2` היו הפוכים מהצבעים החיים בפועל (`#ff3d77`/`#7b5cff`). זה לא היה רק עניין ויזואלי באתר — זה ה-source-of-truth שעתיד להזין את ה-RN pipeline (Style Dictionary) שעדיין לא נבנה, כלומר אפליקציית ה-RN העתידית הייתה מקבלת מיתוג הפוך. תוקן ב-JSON וב-CSS.
- **`tokens.css` קושר בבטיחה** — `<link>` הוצב *לפני* בלוק `<style>` הפנימי, כך שכל משתנה המוגדר בשניהם נשאר בערך הקיים (cascade order), ואומת computed-style ב-Playwright: `--accent`/`--accent2` זהים לפני ואחרי. אפס שינוי ויזואלי, אבל קטגוריות טוקנים חדשות (spacing/radius/motion/z-index) זמינות מהיום לכל קוד עתידי.
- **לא בוצע:** שינוי בפועל לפלטת `--bg`/`--card`/`--line`/`--muted` של נטה (אלה שונים מהקיים אך לא "שגויים" — החלטת מיתוג, לא באג). נשאר open decision לנטה עם visual diff.
- **4 endpoints backend נבדקו חיים** (`curl`, לא רק code review): `/api/analyze` (עם תמונת טסט אמיתית), `/api/stylist/chat`, `/api/outfit/generate`, `/api/declutter` — כולם מחזירים 200 + JSON תקין גם בלי `ANTHROPIC_API_KEY` מוגדר (`.env` לא מכיל אותו כלל). `/api/analyze` מחזיר נכון retailers גלובליים (Google Shopping/ASOS/Depop/ZARA).
- **נמצא, לא תוקן (Week 2 backlog):** system prompts של `/api/outfit/generate` ו-`/api/declutter` עדיין כתובים ומבוקשים לעבוד בעברית בלבד (כולל ערכי JSON קבועים כמו "מכירה"/"תרומה") — לא עברו את אותו global pivot כמו ה-SYSTEM_PROMPT הראשי. גם הודעת ה-fallback של `/api/stylist/chat` בעברית קבועה גם אם המשתמש שאל באנגלית. לא תוקן עכשיו כי יש coupling אפשרי עם הפרונט (ערכי JSON ספציפיים) שדורש בדיקה לפני שינוי.

### Day 5 — Full regression סופי
- הורץ regression מלא בפעם נוספת אחרי כל שינויי השבוע — **0 שגיאות, 17/17 מסכים תקינים.**
- JS syntax check (JSC) עבר נקי (חוץ מ-`document` ReferenceError הצפוי, אין DOM ב-JSC).

### חסמים פתוחים (לשבוע הבא)
1. **tokens.css palette migration** (bg/card/line/muted) — בעלים: נטה, דורש visual diff + אישור.
2. **i18n לא מקושר בפועל** — קבצי `en.json`/`he.json` קיימים אך האפליקציה עדיין מציגה הכל hardcoded מהטמפלייטים. זו אותה בעיה כמו tokens.css היה (קובץ קיים, לא מחובר) — דורש עבודה משמעותית לא quick-link.
3. **Hebrew-only system prompts** ב-`/api/outfit/generate` ו-`/api/declutter` — סותר את עקרון ה-global שכרמל קבע. דורש בדיקת coupling עם הפרונט לפני שינוי.
4. **Style Dictionary pipeline לא קיים** — `tokens.css` מתעד "DO NOT edit manually — generated from JSON" אבל אין שום generator בפועל. נטה.

### השבוע הבא — מטרה ראשית
לפי הנחיית כרמל ("תריצו עוד שבוע ועוד שבוע עד שאני חוזר") — ממשיכים מחזור Build/Verify על הסעיפים שנמצאו. הראשון בתור: i18n actual wiring (הסיכון הגדול ביותר שנשאר — קובץ שנוצר ולא מחובר, בדיוק הדפוס שגרם לבאג tokens.css).
