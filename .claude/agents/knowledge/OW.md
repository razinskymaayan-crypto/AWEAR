# OW — Org-Wide Iron Rules (source of truth)
> **כל סוכן קורא את זה, ללא יוצא מן הכלל.** קובץ זה הוא ה-single source of truth לכל קודי OW-* (כרגע OW-001..OW-014 — אל תעצור ב-006).
> Domain files (be/ds/mb/sf/mg.md) מפנים לכאן — לא מכפילים.

---

### OW-001 | rename = 3 שכבות, לא 1
**מקור:** price_estimate_ils → usd incident (2026-06-18), חזר כממצא audit (2026-06-19)
**לקח:** כל שינוי שם שדה/endpoint חייב לכסות: backend (app.py) + frontend (index.html) + mobile (mobile/). fix שמכסה שכבה אחת ייראה סגור ויחזור.
**מנגנון:** לפני merge — grep על השם הישן ב-3 המקומות. תוצאות ה-grep ב-PR description.
**skill:** `backend-rename-safety` — הפעל לפני כל rename.

---

### OW-002 | "הושלם" ≠ "נבדק"
**מקור:** shira_retrospective + dana_retrospective (2026-06-19)
**לקח:** קוד שקיים ≠ feature שעובד. "moderation exists in code" — לא נבדק חיה עם curl. "CameraScreen exists" — capturedPrimaryButton ללא onPress. הכרזה על "הושלם" ללא ריצה בפועל = הצהרה שקרית.
**מנגנון:** definition-of-done מפורש בכל dispatch. לפחות: curl / Metro bundle / Playwright — לפי סוג הfeature.

---

### OW-003 | תיאום לפני עבודה על קבצים משותפים
**מקור:** oren_retrospective — conflict עם דולצ'ה ב-Compare picker (2026-06-19)
**לקח:** conflict בין אורן ודולצ'ה על אותה שורה ב-index.html — נמנע בקריאה אחת של activity_log.md לפני dispatch.
**מנגנון:** לפני כל עבודה על `static/index.html` / `app.py` / `mobile/App.js` — קרא `.claude/agents/activity_log.md`. אם יש overlap — תאם טווח שורות לפני שמתחיל.

---

### OW-004 | פער בין "יודע שהכלי קיים" לבין "מפעיל אותו"
**מקור:** varan_retrospective + sam_retrospective (2026-06-19)
**לקח:** backend-rename-safety קיים בגלל ₪/$. לא הופעל. stall-escalation מוגדר. לא הופעל. learnings.md לא היה קיים אף שנזכר בinstructions. הפער הוא לא "לא ידעתי" — הפער הוא בין רשימה לפעולה.
**מנגנון:** כל סוכן: בתחילת task — קרא סעיף הסקילים שלך ושאל "האם מישהו מהם רלוונטי כעת?"

---

### OW-005 | תשתית שקיימת ≠ תשתית שבשימוש
**מקור:** netta_retrospective (2026-06-19) — 402 שורות font-size hardcoded; token system כמעט לא בשימוש
**לקח:** tokens.css קיים. awear-tokens.json קיים. 402 שורות font-size hardcoded בindex.html, 226 hex values. "יש לנו design system" ≠ "אנחנו משתמשים בו". כל תשתית — דורשת grep לפני דיווח "coverage".
**מנגנון:** כל cycle — `grep -c "var(--t-" static/index.html`. תעד את המספר. המספר צריך לעלות.

---

### OW-006 | כלל ללא מנגנון אכיפה = המלצה
**מקור:** mark_retrospective (2026-06-19) — Iron Rule נכתב ב-18.06, עוקף ב-18.06
**לקח:** כלל שנכתב ב-CLAUDE.md ולא משנה workflow בפועל הוא הצהרה. כל כלל חייב: (1) מי אוכף, (2) מתי נבדק, (3) מה קורה כשמופר.
**מנגנון:** לפני Board Sync — כל מנהל בודק: "כל כלל ברזל שכתבתי — יושם בcycle שעבר?"

---

### OW-007 | מיפוי live-data: לפתור שדה אמיתי, לא לקודד קבוע
**מקור:** Carmel/Razi UX pass (2026-06-30) — `loadFeedData` קודד `category:'top'` לכל פריט מתויג → כל ה-pills בפיד הראו אייקון חולצה. ה-CAT_ICON map היה מושלם; הבאג היה ב-data.
**לקח:** ערך קבוע בתוך פונקציית מיפוי API→UI הוא code smell. אם שדה יכול להשתנות (category/name/price) — חייבים לפתור אותו מהמקור (productMap[pid].category), לא literal.
**מנגנון:** בכל מאפר API→UI — grep אחרי literals בשדות (`category:'`, `type:'`). שדה שמשתנה בין פריטים ולא נפתר מהמקור = באג.

---

### OW-008 | לחווט ל-DOM לפי הclass האמיתי מאתר ה-render
**מקור:** Carmel/Razi UX pass (2026-06-30) — double-tap like קרס: ה-handler חיפש `.fca-icon` בעוד ה-render יוצר `.fca-ico`. querySelector החזיר null → `null.innerHTML` זרק.
**לקח:** אל תנחש שם class. handler שמכוון לאלמנט שעבר render חייב את ה-class המדויק מפונקציית ה-render.
**מנגנון:** כל querySelector/closest על markup שעבר render — grep את ה-class באותו קובץ קודם. אל תסמוך על זיכרון.

---

### OW-009 | grep למערכת קיימת-אך-לא-מחווטת לפני בנייה חדשה
**מקור:** Shira, comments (2026-06-30) — sheet תגובות שלם כבר היה קיים (`openCommentsSheet`) אך יתום (`reactionsHTML` = dead code, ללא entry point). חיברה אותו במקום לכפול.
**לקח:** feature שאתה עומד לבנות עשוי כבר להתקיים, לא-מחווט. כפילות = שני מקורות אמת.
**מנגנון:** לפני בניית קומפוננטה — grep את שם ה-feature (comment/sheet/modal/collage) בקובץ. אם קיים אך לא נקרא — חווט, אל תכפול.

---

### OW-010 | סוכנים במקביל על אותו קובץ-ענק = worktrees + עוגני-CSS נפרדים
**מקור:** Jeff orchestration, Carmel/Razi UX pass (2026-06-30) — 4 סוכני frontend על `index.html` דרך worktrees מבודדים, כל אחד הוסיף CSS ליד עוגן נפרד → 6 מיזוגים, 0 קונפליקטים. סוכן backend (`app.py`, קובץ אחר) רץ חופשי במקביל.
**לקח:** שני סוכנים בו-זמנית על אותו קובץ גדול ב-tree המשותף = race/קונפליקט. קבצים שונים = מקביל בטוח.
**מנגנון (ג'ף/אורקסטרטור):** (1) לעולם לא >1 סוכן על אותו קובץ ב-tree המשותף — בודד ב-worktree. (2) הנחה כל סוכן להוסיף CSS צמוד לבלוק הקיים של ה-feature שלו. (3) מזג בטור עם `node --check` בין מיזוגים. (4) backend (קובץ נפרד) רץ במקביל ל-frontend.

---

### OW-011 | אנטי-זגזוג — לא לחזור לאזור שכבר טופל
**מקור:** Carmel/Razi factory diagnosis (2026-06-30) — 3 המסכים המרכזיים (Feed/Profile/Item-sheet) לוטשו 3× כל אחד עם זגזוג: השתיקו את ה-Buy CTA → ירד purchase-intent → cycle הבא החזיר (IDEAS #29/#31/#32). הכלל "תמיד יש מה לשפר" שלח סוכנים חזרה למסכים גמורים.
**לקח:** ליטוש שחוזר לאותו אזור+נושא שכבר טופל = עבודה מבוזבזת שמוחזרת. החלטות עיצוב מתנדנדות בלי end-state נעול ובלי metric שמכריע.
**מנגנון:** (1) לפני נגיעה במסך — בדוק `activity_log` + `docs/SURFACE_SPECS.md`; אל תשנה אזור+נושא שכבר "done" ואל תפתח החלטה נעולה (למשל: Buy CTA נשאר בולט) בלי ANSWERED directive או metric. (2) polish = העדיפות הנמוכה, מוגבל ל-1 לריצה. (3) `scripts/guard_checks.sh` חוסם commit שחוזר לאזור מוקפא בלי ציטוט signal.

---

### OW-012 | שאל, אל תנחש — לולאת שאלות-מייסדים יומית
**מקור:** Carmel/Razi factory diagnosis (2026-06-30) — סוכנים בנו לפי ניחוש מה "בעל ערך" במקום לפי כיוון מייסדים; בעיות אמיתיות (Dynamic Island, buy-on-own-profile) נכנסו למערכת רק כשמייסד הקליד אותן ידנית.
**לקח:** ניחוש כיוון מוצרי = עבודה שמוחזרת. צריך ערוץ קבוע שבו הסוכנים שואלים והמייסדים מכווינים מדי יום.
**מנגנון:** קודם הכרע לפי הסדר **MASTER_PLAN → docs/SURFACE_SPECS.md → .claude/master/GUIDANCE.md**. רק פורק כיוון שלא נפתר → כתוב שאלה ב-`.claude/master/FOUNDER_QUESTIONS.md "## OPEN"` (אופציות + המלצה + loop-stage + category), קח משימה אחרת. **נטה לשאול** מאשר לנחש. פעם ביום המייסדים עונים (בשיחה עם ה-assistant ב-SessionStart, או ב-Telegram); directive שעונה = עדיפות עליונה בריצה הבאה. **הצטברות:** תשובה עקרונית מקודמת ל-`GUIDANCE.md` כך שלא נשאל שוב על אותו סוג. שאלה תקועה זמן רב → push ל-Telegram (daily-report).

---

### OW-013 | מיזוג בטור = כל gate נבדק מול BASE של הענף, לא מול origin/main
**מקור:** jeff-merge stuck loop (2026-07-12/13) — GATE 0 בדק `diff origin/main...HEAD` בזמן שהלולאה ממזגת lanes בטור לאותו main מקומי. אחרי ש-lane מוקדם מוזג בהצלחה, ה-diff של ה-lane הבא הכיל גם את הקבצים שלו → `ayalon(ownership)` נדחה 3 מחזורים ברצף על `app.py` של steve ועל `static/*` של mark (קורלציה מלאה ב-gate-ledger בין `merged -> X` לקבצי הדחייה בכל מחזור); וה-`reset --hard` ל-origin/main בעת דחייה מחק בשקט את המיזוג שכבר אושר של ה-lane המוקדם — בעוד הענף שלו נמחק כ"merged" (עבודת ה-theme של mark "מוזגה" 3× ומעולם לא נחתה על main).
**לקח:** בלולאת מיזוג סדרתית, כל בדיקה ו-rollback פר-ענף חייבים עוגן פר-ענף — ה-HEAD שנלכד רגע לפני המיזוג של אותו ענף (`$BASE`). עוגן גלובלי מאשים ענפים מאוחרים בעבודת המוקדמים, וה-rollback שלו משמיד עבודה מאושרת.
**מנגנון:** (1) `BASE=$(git rev-parse HEAD)` לפני כל merge בלולאה; כל diff/rollback של ה-gates עובד מול `"$BASE"`. (2) תיקון self-heal שנוגע ב-`.github/workflows/` לא יכול לנחות מריצת lane בכלל: ה-workflow שרץ הוא תמיד הגרסה מ-main (workflow_run = default branch; push של GITHUB_TOKEN לא מפעיל triggers), GATE 0 דוחה `.github/` מ-lanes דוקומנטיים, ול-lane אין push מעבר ל-HEAD:auto/<lane>. המסלול: בנה+אמת את התיקון, שלח אותו כ-`notes/*.patch` בענף שלך, והסלם ב-NEEDS_YOU.md + Telegram ל-apply של המייסד.

---

### OW-014 | תיקון באג = לשלוח את בדיקת-הרגרסיה באותו PR (אחרת הבאג חוזר)
**מקור:** כיוון מייסד (2026-07-13) — "אתה מתקן באגים אבל טעויות פשוט ממשיכות לחזור." שלושה מקרים: (א) באג מטמון ה-WebView (app.js/css נטענו stale) חזר למרות code-comment; (ב) `test_comments_pagination_and_total` נכשל שבועות כי טסט לא-הרמטי (מפתח AI ב-env הפך את המודרציה ל-LIVE ולא-דטרמיניסטית) — ירוק ב-CI, אדום מקומית, אף אחד לא סגר; (ג) הסוכנים רצו על `--model claude-fable-5` שמכסתו אזלה → כל ריצה מתה מיד + שלחה טלגרם-כשל, כי דפוס-הדילוג לא זיהה "reached your … limit".
**לקח:** תיקון בלי בדיקה שנכשלת-לפני-ומצליחה-אחרי = המלצה, לא תיקון (ראה [[OW-006]]). באג שחזר פעמיים = חסרה לו בדיקה אוטומטית. טסט שמתנהג אחרת תלוי env מקומי = לא-הרמטי = "עובד אצלי" מזויף.
**מנגנון:** כל bugfix חייב באותו PR: (1) בדיקה שמשחזרת את הבאג (pytest / `scripts/check-interactions.mjs` / assertion) שנכשלת על הקוד הישן ועוברת על החדש; (2) הבדיקה רצה בשער (jeff-merge pytest + check-render/interactions) כך שרגרסיה תיחסם. **טסטים הרמטיים בלבד** — לא תלויים במפתחות/רשת/שעון/סדר-ריצה (נטרל ב-conftest, ראה `_hermetic_ai_env`). באג ב-UX/אינטראקציה (sheet תקוע, כפתור מת) → הרחב את `check-interactions.mjs` לכסות אותו, לא רק תקן ידנית.
