# knowledge/be.md — Backend + Integration
> **קרא גם:** [[OW.md]] (OW-001..OW-006 — Org-Wide Iron Rules, single source of truth)

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
**סגור 2026-06-26 — Cycle 2 (oren):** BE-002 נסגר. השורה 2305 הישנה כבר לא קיימת (ILS הוסר מזמן, הכל USD). הבעיה שנותרה: seed posts הציגו `look_total_usd` (למשל $149) שלא תאם לסכום ה-`items[]` שלהם ($547) — סתירה גלויה ב-sheet של "Buy this look". **התיקון = single source of truth:** הוספתי `lookTotalOf(post)` שמסכם מחירי פריטים (fallback ל-look_total_usd רק כשאין פריטים מתומחרים). כל שלוש נקודות התצוגה (כפתור buy בפיד, שורות ה-sheet, "Look total") נגזרות ממנו. `openSheetLook` מחשב את הסכום מהפריטים שהוא עצמו מרנדר → כל caller מתוקן אוטומטית.
**לקח כללי:** מספר מצרפי שמוצג ליד הפירוט שלו חייב להיגזר מהפירוט — לא משדה מאוחסן בנפרד שיכול לסטות. שדה seed שנשמר ידנית מתיישן ברגע שמישהו מוסיף/משנה items.

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


## BE-IDEMPOTENT — money/credit writes need an idempotency key (2026-06-28, sam)
Fire-and-forget POSTs from the client (`fetch(...).catch(()=>{})`) WILL be retried/double-fired (double-tap, network retry). For any endpoint that writes money or a ledger row (orders, credits, payments), accept an optional client-supplied `client_ref`, SELECT-before-INSERT on `(user_key, client_ref)`, and return the existing row (with `deduped:true`, zero new side-effects) on a hit. Keep it backward-compatible: empty `client_ref` = legacy behavior. Use an ADDITIVE guarded migration (`PRAGMA table_info` + `ALTER TABLE ADD COLUMN`, never DROP/recreate) and a NON-unique index (a UNIQUE on the new column would collide with existing `''` rows). Ties to MASTER_PLAN locked decision #11 (credits ledger append-only & idempotent).
