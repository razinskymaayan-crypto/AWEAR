# OW — Org-Wide Iron Rules (source of truth)
> **כל סוכן קורא את זה, ללא יוצא מן הכלל.** קובץ זה הוא ה-single source of truth ל-OW-001..OW-006.
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
