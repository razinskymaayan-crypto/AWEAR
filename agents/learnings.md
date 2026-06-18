# agents/learnings.md — בסיס למידה משותף

> **חוק השימוש:** בתחילת כל task — קרא את הסעיפים של התפקיד שלך ושל המנהל שלך.
> בסוף כל תקרית — הוסף לקח לסעיף המתאים. תאריך + מקור חובה.
> אל תמחק לקח ישן — עדכן אותו אם השתנה.

---

## ○ ORG-WIDE — כל סוכן קורא את זה, ללא יוצא מן הכלל

### OW-001 | rename = 3 שכבות, לא 1
**מקור:** price_estimate_ils → usd incident (2026-06-18), חזר כממצא audit (2026-06-19)
**לקח:** כל שינוי שם שדה/endpoint חייב לכסות: backend (app.py) + frontend (index.html) + mobile (mobile/). fix שמכסה שכבה אחת ייראה סגור ויחזור.
**מנגנון:** לפני merge — grep על השם הישן ב-3 המקומות. תוצאות ה-grep ב-PR description.

### OW-002 | "הושלם" ≠ "נבדק"
**מקור:** shira_retrospective + dana_retrospective (2026-06-19)
**לקח:** קוד שקיים ≠ feature שעובד. "moderation exists in code" — לא נבדק חיה עם curl. "CameraScreen exists" — capturedPrimaryButton ללא onPress. הכרזה על "הושלם" ללא ריצה בפועל = הצהרה שקרית.
**מנגנון:** definition-of-done מפורש בכל dispatch. לפחות: curl / Metro bundle / Playwright — לפי סוג הfeature.

### OW-003 | תיאום לפני עבודה על קבצים משותפים
**מקור:** oren_retrospective — conflict עם דולצ'ה ב-Compare picker (2026-06-19)
**לקח:** conflict בין אורן ודולצ'ה על אותה שורה ב-index.html — נמנע בקריאה אחת של activity_log.md לפני dispatch.
**מנגנון:** לפני כל עבודה על `static/index.html` / `app.py` / `mobile/App.js` — קרא `agents/activity_log.md`. אם יש overlap — תאם טווח שורות לפני שמתחיל.

### OW-004 | פער בין "יודע שהכלי קיים" לבין "מפעיל אותו"
**מקור:** varan_retrospective + sam_retrospective (2026-06-19)
**לקח:** backend-rename-safety קיים בגלל ₪/$. לא הופעל. stall-escalation מוגדר. לא הופעל. learnings.md לא היה קיים אף שנזכר בinstructions. הפער הוא לא "לא ידעתי" — הפער הוא בין רשימה לפעולה.
**מנגנון:** כל סוכן: בתחילת task — קרא סעיף הסקילים שלך ושאל "האם מישהו מהם רלוונטי כעת?"

### OW-005 | תשתית שקיימת ≠ תשתית שבשימוש
**מקור:** netta_retrospective (2026-06-19) — 402 שורות font-size hardcoded; token system כמעט לא בשימוש
**לקח:** tokens.css קיים. awear-tokens.json קיים. 402 שורות font-size hardcoded בindex.html, 226 hex values. "יש לנו design system" ≠ "אנחנו משתמשים בו". כל תשתית — דורשת grep לפני דיווח "coverage".
**מנגנון:** כל cycle — `grep -c "var(--t-" static/index.html`. תעד את המספר. המספר צריך לעלות.

### OW-006 | כלל ללא מנגנון אכיפה = המלצה
**מקור:** mark_retrospective (2026-06-19) — Iron Rule נכתב ב-18.06, עוקף ב-18.06
**לקח:** כלל שנכתב ב-CLAUDE.md ולא משנה workflow בפועל הוא הצהרה. כל כלל חייב: (1) מי אוכף, (2) מתי נבדק, (3) מה קורה כשמופר.
**מנגנון:** לפני Board Sync — כל מנהל בודק: "כל כלל ברזל שכתבתי — יושם בcycle שעבר?"

---

## ○ MANAGEMENT — ג'ף, סטיב, איילון, מארק, וראן

### MG-001 | מנהל שמגיע ריק = bottleneck מוסווה
**מקור:** mark_retrospective + varan_retrospective (2026-06-19)
**לקח:** מנהל שממתין לשאלה "מה אתה צריך?" לא נוכח — הוא reactive. Board Sync = מנהל מגיע עם backlog מתועדף, לא עם שתיקה.
**מנגנון:** לכל מנהל: תחילת כל cycle — כתוב backlog של 3 עדיפויות. הצג בBoard Sync גם אם לא נשאלת.

### MG-002 | עקיפת מנהל יוצרת עמימות, לא מהירות
**מקור:** jeff_retrospective + mark_retrospective + varan_retrospective (2026-06-19)
**לקח:** ג'ף שמשגר ישירות לIC (דולצ'ה, דנה, רועי) ללא עצירה במארק/וראן — מפנה את שכבת הניהול. ה-IC מקבל direction לא מתואם. מהירות ה-dispatch אינה שוות ערך לאיכות התוצר.
**מנגנון (ג'ף):** dispatch לIC בתחום מנהל → תיעד מה גרם לזה + עדכן המנהל בסוף. עקיפה חוזרת = כשל מבני.
**מנגנון (מנהל):** dispatch לIC ללא כיוון ממנהל → מנהל מתערב מיידית, לא שותק.

### MG-003 | observation בלי proposal = תרומה חלקית
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** Product Director שמעלה ממצא ("זה שבור") בלי הצעת פתרון לא השלים את התרומה. הממצא לבד לא מניע תזוזה.
**מנגנון (איילון):** כל ממצא בפגישת מנהלים מגיע עם: בעיה + הצעה + מי אמור לבצע.

### MG-004 | scope report פותח cycle, לא סוגר
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** דיווח scope בסוף cycle הוא postmortem. בתחילת cycle הוא כלי תכנון. ההחלפה ביניהם גרמה לכך שלא ידענו מה תקוע עד שכבר הפסדנו זמן.
**מנגנון (איילון):** הדבר הראשון בכל Board Sync = טבלת scope: מה זז / לא זז / חסם. לא summary — action.

### MG-005 | CTO שקורא קוד שורה-שורה = כשל רשת, לא הצלחה
**מקור:** steve_retrospective (2026-06-19)
**לקח:** audit ידני של CTO מחשיף בעיות נכון — אבל כך בדיוק מוכח שה-checklist/review/test מתחתיו לא עבד. הממצא חשוב; הצורך לעשות אותו בעצמו הוא הבעיה.
**מנגנון (סטיב):** בסוף כל audit ידני — "מה בתהליך לא תפס את זה?" לתקן תהליך, לא רק באג.

### MG-006 | State A vs State B — delegation לא יכול להיות עמום
**מקור:** jeff_retrospective (2026-06-19)
**לקח:** בסשן שכרמל + ג'ף פועלים ביחד, כל dispatch יכול להיות "ג'ף מחליט ומאציל" (State A) או "ג'ף מבצע בשם תפקיד" (State B). עמימות ביניהם יוצרת מראית-delegation שהיא בפועל centralization.
**מנגנון (ג'ף):** שאלת פתיחה קנונית: "מה ג'ף צריך להחליט היום? מה כבר מואצל?" תיעד State A/B בכל dispatch.

---

## ○ BACKEND + INTEGRATION — סאם, אורן

### BE-001 | rename → grep 3 שכבות → commit. בסדר הזה תמיד.
**מקור:** SAM-L001 (2026-06-18), OW-001 (2026-06-19)
**לקח:** `price_estimate_ils → usd` שבר 54 מקומות בfrontend. ה-fix כיסה רק app.py. חזר.
**מנגנון:** backend-rename-safety skill → grep על index.html → grep על mobile/ → commit. אין קיצורים.

### BE-002 | look_total_usd — חוב ידוע לcycle הבא
**מקור:** oren_retrospective (2026-06-19)
**לקח:** 4 מקומות ב-index.html שמציגים `look_total_usd` עם ₪ — לא כוסו בcycle 19.06. זה חוב ידוע, לא surprise.
**מנגנון (אורן + סאם):** cycle הבא — grep על look_total_usd, אישור סאם על schema, תיקון.

### BE-003 | schema owner = סאם. integration = אורן. לא מתחלפים.
**מקור:** oren_retrospective (2026-06-19)
**לקח:** אורן מצא בעיות schema (look_total_usd), סאם ביצע. הסדר נכון. אך: אורן לא מחליט על schema, סאם לא מחליט על integration. הגבול ברור — ולא משתנה תחת לחץ.

---

## ○ DESIGN SYSTEM — נטה, דולצ'ה, גבאנה

### DS-001 | token קיים ≠ token בשימוש
**מקור:** netta_retrospective (2026-06-19)
**לקח:** 402 שורות hardcoded font-size. 226 hardcoded hex values. token system קיים — לא בשימוש. "יש לנו tokens" ≠ "הקוד משתמש בהם". גרסה הבאה של "אנחנו token-based" חייבת לכלול grep מספרי.
**מנגנון (נטה):** cycle-opening grep: `grep -c "var(--t-" static/index.html`. תעד. P0 migration: #2a2040, #1a1030 (13 הופעות).

### DS-002 | P0-filers עוברים self-check לפני גבאנה
**מקור:** gabbana_retrospective (2026-06-19)
**לקח:** הביקורת היקרה ביותר היא כשגבאנה מגלה P0 שדולצ'ה הייתה אמורה לתפוס. זה מבזבז cycle time ומסמן כשל של שתיהן.
**מנגנון (דולצ'ה):** לפני כל review request לגבאנה — self-check: emoji? hardcoded hex? placeholder text? תיקון ≤5 דקות > review חדש.
**מנגנון (גבאנה):** אם מגיע P0-filer ידוע — לא עושה full audit, מחזיר מיד עם תיאור המה-שחסר.

### DS-003 | audit ללא input = audit חלקי
**מקור:** gabbana_retrospective (2026-06-19)
**לקח:** ביקורת על "גרסה כללית" היא ביקורת שלא ניתן לשחזר ולא ניתן להשוות. לכל audit: commit hash + שם מסך + breakpoint.
**מנגנון (גבאנה):** בלי 3 האלמנטים — מחזירה בקשה לדולצ'ה לפני שמתחילה.

### DS-004 | CSS fallback חובה לכל var()
**מקור:** shira_retrospective (2026-06-19)
**לקח:** --fg ו--surface מוגדרים ב-tokens.css — אבל אם tokens.css לא נטען, טקסט שחור על רקע שחור. "מוגדר בקובץ חיצוני" ≠ בטוח.
**מנגנון:** כל token שמשתמשים בו בdynamic context — fallback ב-:root פנימי.

---

## ○ SOCIAL FEATURES — שירה

### SF-001 | severity thresholds = product decision, לא engineering
**מקור:** shira_retrospective (2026-06-19)
**לקח:** moderation קיים בקוד (commit de309a6). severity thresholds לא אושרו על ידי איילון. זה לא "פרט טכני" — זה החלטה על מה מותר ומה אסור בפלטפורמה.
**מנגנון (שירה):** moderation לא יוצא לפרודקשן ללא sign-off של איילון על thresholds.

### SF-002 | "קוד moderation קיים" ≠ "moderation עובד"
**מקור:** shira_retrospective (2026-06-19)
**לקח:** `/api/moderate` קיים. `moderateCommentAsync()` קיים. לא נבדקו חיה עם curl. זה OW-002 ברמת הsocial domain.
**מנגנון (שירה):** לפני כל "הושלם" על feature של API — curl test + תיעוד response.

---

## ○ MOBILE — וראן, דנה, רועי

### MB-001 | stall-escalation = וראן מפעיל, לא IC
**מקור:** varan_retrospective (2026-06-19)
**לקח:** וראן ידע על כלל הstall. לא הפעיל אותו. ה-IC (דנה/רועי) לא אמורים לדווח על עצמם שהם תקועים — זה role של מנהל המובייל.
**מנגנון (וראן):** 48 שעות בלי commit מIC — וראן מפעיל stall-escalation. לא שואל. לא מחכה.

### MB-002 | navigation stack + state management — לפני IC, לא אחרי
**מקור:** varan_retrospective (2026-06-19)
**לקח:** דנה ורועי עבדו ב-parallel בלי שהוחלט: navigation stack, state management, AsyncStorage schema. קונפליקטים אפשריים ב-merge שלא נמנעו מראש.
**מנגנון (וראן):** לפני כל dispatch ל-IC — agents/plans/ מכיל החלטת navigation + state. ללא שניהם — dispatch לא יוצא.

### MB-003 | "האפליקציה באנגלית" ≠ i18n הושלם
**מקור:** roei_retrospective (2026-06-19)
**לקח:** LOCALE='en' שונה. אבל: אין t() helper שקורא אותו בweb. 614 מחרוזות עברית hardcoded בindex.html. "האפליקציה באנגלית" היא הצהרה שקרית עד ש: t() helper מחובר + grep מחזיר 0 Hebrew strings hardcoded.
**מנגנון (רועי):** לא להכריז i18n web כ"done" ללא שני הקריטריונים. בcycle הבא: FeedScreen.js (3 cards, getItemLayout, 24h).

### MB-004 | CameraScreen — gaps קריטיים לcycle הבא
**מקור:** dana_retrospective (2026-06-19)
**לקח:** CameraScreen קיים. שני gaps קריטיים: (1) expo-image-manipulator חסר ב-package.json → אין compression, (2) capturedPrimaryButton ללא onPress → navigate לא קיים.
**מנגנון (דנה):** cycle הבא — compressForUpload(uri) + onPress → target 400KB, commit אחד.

---

## ○ PRODUCT — איילון

### PR-001 | scope report = action list, לא status update
**מקור:** ayalon_retrospective (2026-06-19)
**לקח:** טבלת scope בBoard Sync היא לא "הנה המצב". היא "הנה מה שצריך לזוז ולמה הוא לא זז". כל שורה עם חסם — מסתיימת בaction item, לא בממצא.
**מנגנון:** פורמט קבוע לכל Board Sync: `סוכן | scope | status | חסם | action`.

---

## ○ CEO / STRATEGY — ג'ף

### CE-001 | שאלת פתיחה קנונית לכל cycle
**מקור:** jeff_retrospective (2026-06-19)
**לקח:** "מה ג'ף צריך להחליט היום? מה כבר מואצל?" — שאלה זו מנקה עמימות, מונעת centralization, ומאפשרת delegation אמיתי. בלי השאלה — הכל מגיע לג'ף, וזה צוואר בקבוק מוסווה כניהול.
**מנגנון:** השאלה הזו היא הדבר הראשון בכל cycle, לפני כל dispatch.

---

## ○ כיצד להוסיף לקח חדש

1. בחר סעיף מתאים (OW / MG / BE / DS / SF / MB / PR / CE)
2. הוסף ID חדש (הממשיך מה-ID האחרון בסעיף)
3. פורמט חובה:
   ```
   ### [ID] | [כותרת קצרה]
   **מקור:** [מי, מתי]
   **לקח:** [מה קרה ומדוע זה חשוב]
   **מנגנון:** [הפעולה הקונקרטית שמונעת חזרה]
   ```
4. אל תמחק לקח ישן — עדכן אם השתנה, וציין "עודכן: [תאריך]"

---

*עודכן לאחרונה: 19.06.2026 — לאחר תחקיר עצמי של כל 13 הסוכנים*
