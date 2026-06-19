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

