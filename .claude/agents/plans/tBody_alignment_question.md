> ⚠️ הפניות במסמך זה ל-DESIGN_STANDARDS התיישנו — המקור העדכני: docs/VISUAL_VISION.md. תוכנית אב: .claude/master/MASTER_PLAN.md.

# שאלה למארק: typography token alignment — שלוש החלטות פתוחות

**deadline:** לפני Cycle 2 typography migration.

---

## שאלה 1: --t-body — 14px vs 15px

**הקשר:** tokens.css מגדיר `--t-body: 14px`. ה-spec החדש הציע 15px.

**ההשפעה:**
- 14px = compact — מתאים לממשקים עמוסי מידע, serif-optimized, ישראלי-ספציפי
- 15px = spacious — Instagram/Depop body size, תחושת אוויר גדולה יותר

**מה שבקוד עכשיו:** index.html משתמש ב-14px ו-15px hardcoded מעורב — אין אחידות.

**ההחלטה שנדרשת:** לאחד על 14px, 15px, או לשמור שניהם (`--t-body: 14px` + `--t-body-lg: 15px`)?

---

## שאלה 2: שמות tokens — פער קריטי בין DESIGN_STANDARDS לtokens.css

**זו החלטה שחייבת להתקבל לפני שמתחילים Cycle 2 migration. migration על שמות שגויים = חוב כפול.**

**DESIGN_STANDARDS.md (כלל 4) מגדיר:**
```
--t-xs: 11px | --t-sm: 13px | --t-md: 15px | --t-lg: 19px | --t-xl: 26px
```
5 טוקנים, שמות קצרים, סקאלה צפופה.

**tokens.css בפועל מגדיר:**
```
--t-micro: 11px | --t-small: 13px | --t-h3/body: 14-15px | --t-lead: 17px
--t-h2: 18px | --t-title: 20px | --t-h1: 24px | --t-display: 32px
```
10 טוקנים, שמות סמנטיים, סקאלה מורחבת.

**הערות:**
- DESIGN_STANDARDS נכתב ב-19.06.2026 לאחר ישיבת מנהלים — ייתכן שלא לוקח בחשבון את ה-token system שכבר קיים
- tokens.css נבנה מ-awear-tokens.json — הוא ה-source of truth הנוכחי
- הסקאלה של DESIGN_STANDARDS (11/13/15/19/26px) שונה מ-tokens.css (11/12/13/14/15/17/18/20/24/32px)
- ה-token `--t-md: 15px` ב-DESIGN_STANDARDS תואם ל-`--t-h3` ב-tokens.css — אבל `--t-lg: 19px` לא קיים בכלל ב-tokens.css

**ההחלטה שנדרשת:** מאיזו סקאלה מבצעים את ה-migration?
- **אפשרות A:** tokens.css הקיים (10 גדלים, שמות סמנטיים) — migration כבר מוכן, source of truth קיים
- **אפשרות B:** DESIGN_STANDARDS (5 גדלים, שמות קצרים) — פשוט יותר, אבל דורש rename של כל הטוקנים הקיימים + breaking change ל-RN
- **אפשרות C:** היברידי — שמות tokens.css, ערכים מ-DESIGN_STANDARDS (5 גדלים עיקריים + aliases)

**המלצתי:** אפשרות A עם הוספת `--t-lg: 19px` שחסר, כי:
1. awear-tokens.json + tokens.css כבר קיימים ומסונכרנים
2. rename = breaking change לכל ה-RN platform
3. 10 גדלים נותנים גמישות שה-5 גדלים לא נותנים (h1/h2/display לכותרות גדולות)

אבל זו החלטת brand direction — לא token decision בלבד.

---

## שאלה 3: ערכי --t-h1 / --t-h2 / --t-display

המשימה ביקשה: `--t-h1: 30px`, `--t-h2: 24px`, `--t-display: 36px`.
הקיים: `--t-h1: 24px`, `--t-h2: 18px`, `--t-display: 32px`.

**לא שיניתי** — שינוי ערכי token גלובלי ללא review (DS-005) ישפיע על כל component שמשתמש בהם.

**ההחלטה שנדרשת:** האם לאמץ ערכים גדולים יותר? רק אם השאלה בשאלה 2 (איזו סקאלה) הוכרעה קודם.

---

**מארק — אני צריכה אחת משלוש תשובות לפני שמתחיל Cycle 2 migration:**
1. `--t-body`: 14 / 15 / שניהם?
2. token names: A (קיים) / B (DESIGN_STANDARDS) / C (היברידי)?
3. ערכים: האם לשנות h1/h2/display לגדולים יותר?

בינתיים: לא נוגעת בטוקנים. migration לא מתחיל בלי תשובות.

---

## החלטות מארק — 2026-06-19

### שאלה 1: --t-body
**החלטה: 14px.**

נימוק: AWEAR היא פלטפורמה ישראלית-first, compact ממשק הוא פרדיגמה מוכרת לקהל היעד. 15px (Instagram) הוא benchmark נכון — אבל AWEAR לא Instagram. 14px מאפשר צפיפות מידע גבוהה יותר בפיד ובארון בלי לפגוע ב-readability (var(--fg) על var(--card) = 12.1:1 WCAG AAA). index.html מכיל 14px/15px מעורב בhardcoded — migration יאחד ל-14px, שזו עבודה פחותה.

`--t-body: 14px` — נשאר. אין שינוי ב-tokens.css.

### שאלה 2: שמות tokens
**החלטה: אפשרות A — tokens.css הקיים (10 גדלים, שמות סמנטיים).**

נימוק: awear-tokens.json + tokens.css כבר מסונכרנים ומשמשים source of truth. rename ל-DESIGN_STANDARDS (--t-xs/sm/md/lg/xl) = breaking change לכל ה-React Native platform (DS-005 + MB-002). DESIGN_STANDARDS.md יעודכן ע"י נטה ליישר עם שמות tokens.css — לא להיפך. נוסף על כך: 10 גדלים נותנים גמישות שאין ב-5 (h1/h2/display לכותרות גדולות — נדרש בpractice).

פעולה לנטה: הוסיפי `--t-lg: 19px` ל-tokens.css ול-awear-tokens.json (הגודל חסר לחלוטין). עדכני DESIGN_STANDARDS.md שמות לתואם tokens.css.

### שאלה 3: ערכי h1/h2/display
**החלטה: לא משנים בשלב זה.**

נימוק: DS-005 — שינוי ערכי token גלובלי ללא screenshot comparison לפני merge = violation. migration מ-hardcoded font-size עוד לא הושלם, אז אין בסיס להשוואה ויזואלית. לאחר ש-Cycle 2 typography migration יושלם ויש screenshots — נחליט אם h1 צריך לעלות מ-24px ל-30px.

**סיכום:** נטה — Migration Cycle 2 יכול להתחיל. סקאלה: tokens.css הקיים. הוסיפי --t-lg לפני שמתחילות.
