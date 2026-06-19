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


## ○ SOCIAL FEATURES — שירה

### SF-001 | severity thresholds = product decision, לא engineering
**מקור:** shira_retrospective (2026-06-19)
**לקח:** moderation קיים בקוד (commit de309a6). severity thresholds לא אושרו על ידי איילון. זה לא "פרט טכני" — זה החלטה על מה מותר ומה אסור בפלטפורמה.
**מנגנון (שירה):** moderation לא יוצא לפרודקשן ללא sign-off של איילון על thresholds.

### SF-002 | "קוד moderation קיים" ≠ "moderation עובד"
**מקור:** shira_retrospective (2026-06-19)
**לקח:** `/api/moderate` קיים. `moderateCommentAsync()` קיים. לא נבדקו חיה עם curl. זה OW-002 ברמת הsocial domain.
**מנגנון (שירה):** לפני כל "הושלם" על feature של API — curl test + תיעוד response.

### SF-003 | ANTHROPIC_API_KEY חסר = moderation fail-open — P0
**מקור:** שירה (גילוי) + סאם (אימות), Cycle 1 Phase 4, 2026-06-19
**לקח:** /api/moderate מחזיר `{"fallback":true}` על כל input כשהמפתח חסר — כל תוכן, כולל harmful, עובר ללא בדיקה. זה לא "כשל שקט" — זה "אין moderation בכלל". גילוי מאוחר כי לא הייתה בדיקת env בהפעלה.
**מנגנון:** (1) app.py — בדיקת `ANTHROPIC_API_KEY` ב-startup + log WARNING מפורש אם חסר; (2) pre-deploy checklist: env vars required; (3) Steve/Jeff — set secret בprod env לפני כל deploy.
**status 2026-06-19:** agents/logs/api_key_alert.md נוצר. action item פתוח ל-Steve/Jeff.

---

