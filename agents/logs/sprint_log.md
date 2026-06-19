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
- `agents/logs/postmortem_2026-06-17.md` — ניתוח שורש לשתי התקריות, החלטות, ownership.
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

---

## ג'ף — שבוע 2 (24–30.06.2026), Build Days — המשך לפי הנחיית כרמל

### הושלם
- **תוקנו 3 system prompts בעברית-בלבד ב-`app.py`** (`/api/outfit/generate`, `/api/declutter`, fallback של `/api/stylist/chat`) ל-language-agnostic — נבדק coupling עם הפרונט קודם (`showDeclutterResults`/`renderOutfitResults` מציגים `name`/`reason`/`action`/`tip` כטקסט אופאקי בלבד, אין pattern-matching על ערכים בעברית) ולכן זה תיקון בטוח. אומת חי: `curl` לכל 3 ה-endpoints + הרצת `runDeclutter()` בפועל ב-Playwright עם screenshot — "sell • ₪80" מוצג נכון.
- **סקירה פרואקטיבית למניעת באג #3 מסוג RW_KEY**: ניתוח סטטי גילה שיש רק **4 קריאות פונקציה שמתבצעות בפועל ב-top-level synchronous execution** בכל הקובץ (`updateHeaderCityPin`, `renderHome`, `renderCloset`, `renderFeed`) — כל השאר רק נרשמות כ-event handlers ורצות אחרי שהסקריפט כבר אותחל לגמרי (לא יכולות לסבול מ-TDZ). כל 4 נבדקו ידנית: התלויות שלהן (`loadProfile`, `RW_KEY`/`LEVELS`, `SEED_POSTS`/`LIKES`/`SAVED`) כולן מוגדרות לפני נקודת הקריאה. **אין עוד באגים מהסוג הזה בקוד הנוכחי.**
- **גודל אמיתי של פרויקט i18n wiring נמדד, לא הוערך**: `grep` לכל string literal עם תווים בעברית בקובץ — **614 מחרוזות hardcoded**. זה מאשר שזה לא "quick link" כמו tokens.css — זה רי-write רב-ימים שדורש תכנון מסודר (סדר עבודה לפי מסך, לא global find-replace שיהיה הרסני נגד template literals). לא בוצע חלקי כדי לא ליצור מצב ביניים מבלבל (כמו tokens.css לפני שתוקן).
- regression מלא הורץ פעמיים (לפני ואחרי תיקוני ה-prompts) — 0 שגיאות, 17/17.

### חסמים פתוחים (נשארים, לא נסגרו השבוע)
1. tokens.css palette migration — נטה.
2. **i18n wiring — 614 מחרוזות, פרויקט מוגדר בנפרד, לא Week קצר.** מומלץ: לתכנן sprint ייעודי, מסך-מסך, עם QA אחרי כל מסך (לא הכל בבת אחת).
3. Style Dictionary pipeline לא קיים בפועל.

### השבוע הבא — מטרה ראשית
המשך מחזור build/verify. ללא יעד "לגעת ב-i18n" נוסף עד שיש תוכנית sprint מסודרת מאיילון/נטה — ביצוע חלקי שלה יזיק יותר משיעזור.

---

## פגישת בורד + מחלקות — 17.06.2026 (אסטרטגיית עיצוב, ביוזמת כרמל)

מסמך מלא: [board_meeting_2026-06-17_design_strategy.md](board_meeting_2026-06-17_design_strategy.md)

### ממצא הבורד
בדיקה מול `DESIGN_STANDARDS.md` (לא הערכה — grep + קריאת קוד) גילתה שהאפליקציה מפרה את התקן שלה עצמה ב-10+ מקומות: P0 #2 ("בגד הוא תמיד תמונה אמיתית") מופר ב-Marketplace, Shopping Feed, Explore — מוצרים מוצגים כ-emoji. P0 #1 ("אין אימוג'י כ-UI chrome") מופר ב-Stories, Rewards badges, Outfit Generator chips, quiz options.

### Phase 1 — בוצע היום (ג'ף)
הוחלף `it.emoji` ב-`productImage(it)` (התשתית הקיימת — תמונת AI + fallback מעוצב) ב-4 מקומות: Marketplace grid, Shopping Feed grid, Explore inspiration cards, Explore search results. נוספה CSS תואמת (`object-fit`, `overflow:hidden` ב-`.ex-result-emoji`).

**ממצא חשוב שהתגלה בבדיקה:** ה-API שמייצר את התמונות (`pollinations.ai`) עבר ל-**תשלום חובה** — `HTTP 402`, "Queue full... pay to bypass rate limit", מוגבל ל-1 בקשה במקביל ל-IP. זו לא תקלה בקוד שלי. **התוצאה בפועל כרגע: ברוב המקרים מוצג ה-fallback המעוצב (אייקון line-art נקי על גרדיאנט) במקום תמונה אמיתית — אבל זה עדיין שיפור אמיתי על emoji, ועומד בדרישת ה-fallback של התקן.** בבדיקה חזותית, תמונה אחת בכל זאת נטענה בהצלחה ("Cottage Romance") — מאשר שהצנרת תקינה, רק מוגבלת קשות ב-tier החינמי.

**זו לא החלטה שלי לקחת:** האם לשלם על tier בתשלום ל-pollinations, לעבור לספק תמונות אחר (Unsplash API, stock photo service), או לאמץ את ה-fallback המעוצב כשפה חזותית רשמית לseed/demo data — דורש החלטת תקציב/וונדור מכרמל.

### Phase 2 — לא בוצע היום, בכוונה
Emoji chrome (badges/chips/stories) → SVG icons. דורש מיפוי עיצובי (איזה SVG מתאים לכל emoji) — החלטת עיצוב של דולצ'ה, לא תיקון אוטומטי. בעלים: דולצ'ה (מיפוי) + נטה (icon sizing tokens) + גבאנה (אישור).

### Phase 3 — לא בוצע היום
הירארכיה חזותית של מסך הבית (להרגיש "רשת חברתית" לא "דשבורד"). דורש Strategy Day נפרד עם דולצ'ה + איילון.

---

## ג'ף — שבוע (17–23.06.2026), המשך ביצוע Phase 2 — ביוזמת כרמל ("תריצו שבוע עבודה")

### Day 1 (Align) — מיפוי + בדיקת תקציב
- מיפוי emoji→SVG הושלם ובוצע ל-**Rewards screen** במלואו: נוספו 4 אייקונים חדשים לאוסף הקיים (trophy, leaf, crown, users) באותו סטייל line-art (Lucide/Phosphor). LEVELS/PERKS/RW_ACTIONS עברו משדה `emoji` (תו אימוג'י) לשדה `icon` (שם אייקון SVG). אומת חי: 0 שגיאות, screenshots מאשרים רינדור נכון.
- **נחקר לעומק (לא רק נוסה פעם אחת): האם יש חלופה חינמית ל-pollinations.ai.** תוצאה: בדיקות חזרתיות הראו שיעור הצלחה ~50% וכשמצליח — **24 שניות** לתמונה. לא שמיש ל-grid מוצרים בשום תרחיש, גם עם throttling בצד הלקוח. **מסקנה סופית: אין תיקון קוד שפותר את זה. ההחלטה (לשלם, להחליף ספק, או לאמץ fallback כברירת מחדל) נשארת על שולחנך.**

### Day 2–3 (Build) — Outfit Generator + עצירה מכוונת בquiz
- הושלמו 8 אייקונים ל-Outfit Generator scenario chips (כולל 6 אייקונים חדשים: briefcase, plane, gift, coffee, dumbbell, wave). אומת חי עם screenshot.
- **נבדק את quiz options (onboarding) ונמצא שזה לא אותו סוג עבודה.** ה-emoji שם (🌸 למידת XS/S, 💎 לתקציב ₪500-1000) הם markers דקורטיביים שרירותיים בלי שום קשר סמנטי למה שהם מייצגים — לא כמו "📸 = מצלמה" שיש לו מיפוי ברור. כפיית אייקון על "מה ה-vibe שלך — Y2K" היא בדיוק סוג ההחלטה העיצובית ש-Phase 2 הוגדר כ"לא לביצוע אוטומטי" בפגישת הבורד. **לא ביצעתי את זה היום בכוונה, לא מחוסר זמן.**

### Day 4 (Build) — נמצאו עוד 2 הפרות שלא נתפסו ב-Day 1
ה-audit המקורי (Day 1 הקודם) כיסה Marketplace/Shopping Feed/Explore אבל פספס את מסך **Wishlist**: הצעות פריטים (`SHOP_SEED`) הציגו emoji במקום תמונה (אותה הפרת P0 #2) — תוקן עם `productImage()`. וכל פריט ב-wishlist הציג "💫" קבוע כאייקון כללי, ללא קשר לפריט — הפרת P0 #1, אבל בניגוד ל-trending chips/quiz, זה היה **תיקון בטוח כי אותו אייקון מוצג לכל פריט** (אין החלטת מיפוי per-item) — תוקן ל-SVG sparkle.

### Day 5 — Regression סופי
17/17 מסכים, 0 שגיאות. כל 4 ה-commits של השבוע נדחפו ל-GitHub (`origin/main`).

### חסמים פתוחים שלא נסגרו (ולמה זה בסדר שלא נסגרו)
1. **Phase 2 שיורי**: quiz options + EX_TRENDING chips — דורשים פגישת מיפוי אמיתית עם דולצ'ה, לא בוט שמחליט בעצמו על משמעות "✨ Y2K".
2. **תמונות מוצר אמיתיות** — תלוי בהחלטת תקציב/ספק שלך.
3. **tokens.css palette, i18n (614 מחרוזות), Style Dictionary, RN setup, currency layer** — כולם נשארים כמו שתועדו, שום דבר מהם לא "quick win" בלי לשבור משהו.

regression מלא (17 מסכים) הורץ לפני ואחרי Phase 1 — 0 שגיאות.
