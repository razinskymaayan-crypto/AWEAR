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


## ○ BACKEND + INTEGRATION — סאם, אורן

### BE-001 | rename → grep 3 שכבות → commit. בסדר הזה תמיד.
**מקור:** SAM-L001 (2026-06-18), OW-001 (2026-06-19)
**לקח:** `price_estimate_ils → usd` שבר 54 מקומות בfrontend. ה-fix כיסה רק app.py. חזר.
**מנגנון:** backend-rename-safety skill → grep על index.html → grep על mobile/ → commit. אין קיצורים.

### BE-002 | look_total_usd — חוב ידוע לcycle הבא
**מקור:** oren_retrospective (2026-06-19)
**לקח:** 4 מקומות ב-index.html שמציגים `look_total_usd` עם ₪ — לא כוסו בcycle 19.06. זה חוב ידוע, לא surprise.
**מנגנון (אורן + סאם):** cycle הבא — grep על look_total_usd, אישור סאם על schema, תיקון.
**עודכן 2026-06-19 — Cycle 1:** grep מצא 3 מקומות (לא 4). תוקנו 2: שורות 2118 (look grid), 2150 (shop-look button). נותר פתוח: שורה 2305 — `post.price (ILS) || look_total_usd (USD)` — fallback מעורב. שינוי סימן ₪→$ ישבור תצוגת ILS. דורש: (1) סאם מחליט אם `look_total_usd` יוסר מה-fallback chain, (2) או שמוסיפים הגיון ליבה שבוחר סימן לפי מקור הערך. commit: 7244a7b, worktree: fix/look-total-usd.

### BE-004 | in-memory store → SQLite: DB_PATH.parent.mkdir + init_db() בstartup
**מקור:** sam, Cycle 2 (2026-06-19) — _likes_store migration
**לקח:** כל in-memory dict שמכיל state שמשנה משתמשים = חוב שנשמד ב-restart. pattern migration: (1) init_db() → CREATE TABLE IF NOT EXISTS; (2) _get_db() עם row_factory + parameterized queries; (3) init_db() נקרא בstartup event לפני שאר האתחול; (4) data/ directory נוצר עם mkdir(parents=True, exist_ok=True). commit קיים — לא "כבר עשינו בעבר" אלא "תבנית פעילה".
**מנגנון:** לפני כל in-memory store חדש — שאל "האם נתון זה צריך לשרוד restart?" אם כן → SQLite מהיום הראשון.

### BE-005 | saves/bookmarks = SQLite מהיום הראשון, לא in-memory
**מקור:** sam, feat/save-endpoint (2026-06-19) — LGTM confirmed
**לקח:** saves, likes, comments = SQLite מיום 1, לא in-memory. כשdispatch מציע dict לנתון שuser מצפה שישרוד — זו נקודת בדיקה, לא הוראה עיוורת. dispatch הציע `_saves_store: dict = {}` (in-memory). שאלתי "האם נתון זה צריך לשרוד restart?" — כן, bookmarks הם נתון משמעותי למשתמש. הוחלט מהיום הראשון על SQLite. dict לא נכנס לקוד כלל.
**מנגנון:** לפני כל store חדש — שאל את שאלת BE-004. אם התשובה "כן" או "אולי" — SQLite. dispatch שמציע dict = נקודת בדיקה, לא הוראה עיוורת.

### BE-003 | schema owner = סאם. integration = אורן. לא מתחלפים.
**מקור:** oren_retrospective (2026-06-19)
**לקח:** אורן מצא בעיות schema (look_total_usd), סאם ביצע. הסדר נכון. אך: אורן לא מחליט על schema, סאם לא מחליט על integration. הגבול ברור — ולא משתנה תחת לחץ.

---

