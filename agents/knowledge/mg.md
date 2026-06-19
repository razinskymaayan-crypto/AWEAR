# learnings — AWEAR agents
> קרא רק את הסעיפים הרלוונטיים לתפקידך.

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

### CE-002 | בעיה מבנית = שלוש שכבות בו-זמנית, לא תיקון סדרתי
**מקור:** management_meeting_design_crisis (2026-06-19)
**לקח:** ישיבת design crisis חשפה שהבעיה אינה שכבה אחת — היא משוואה: data עם emoji כ-default + CSS ללא enforcement + "done" שמוגדר כ-"עובד" ולא כ-"נראה כמו Instagram" = מוצר שנראה כמו wireframe. תיקון שכבה אחת בלבד מחזיר לאותו מקום. בעיות מבניות דורשות פתרון מקביל לכל השכבות.
**מנגנון:** בישיבת root cause — שאל "כמה שכבות יש לבעיה?" לפני שמחליטים מה לתקן. אם יותר משכבה אחת — הגדר action item לכל שכבה בנפרד, ועם owner נפרד.

---

