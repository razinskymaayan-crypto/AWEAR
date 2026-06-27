# agents/learnings.md — לקחים מצטברים

> קרא קובץ זה בתחילת כל משימה. הוסף לקח חדש אחרי כל תקרית.

---

## OW — ORG-WIDE (כולם קוראים)

**OW-001** — Rename = grep 3 שכבות: `app.py` + `static/index.html` + `mobile/`. תיקון חלקי שובר את ה-frontend (לקח מתקרית price_estimate_ils→usd).

**OW-002** — DoD = grep verified. "I think it works" אינו DoD. curl + grep — חובה לפני סגירת משימה.

**OW-003** — לפני עריכה: בדוק `activity_log.md` שלא קיימת עריכה מתנגשת על אותו קובץ.

**OW-004** — learnings.md חייב להיקרא בתחילת כל משימה. אם לא קיים — צור אותו עם הלקח הראשון לפני שממשיכים.

**OW-005** — כלל על: כשיש ספק — עצור ושאל. פעולה בלתי הפיכה ללא אישור = אסור.

**OW-006** — אירוע אבטחה: עצור והתרע לכל הצוות מיד.

---

## MG — Management (סטיב/CTO)

**MG-005** — MG-005 pattern: `user_key = (request.client.host if request.client else None) or "anon"`. חובה בכל endpoint חדש. לא `request.client.host` ישיר (יכול להיות None).

---

## BE — Backend (סם)

**BE-001** — 3 שכבות: `app.py` (backend) + `static/index.html` (web frontend) + `mobile/` (React Native). שינוי שם שדה ב-app.py חייב לבדוק את שתי שכבות ה-frontend.

**BE-002** — `look_total_usd`: כל חישוב מחיר ב-USD ולא ILS. שם השדה הוא `look_total_usd`.

**BE-003** — הפרדת schema/integration: שינויי סכמה דרך migration ובאישור סטיב.

**BE-004** — SQLite from day 1: כל דאטה פרסיסטנטי ב-SQLite, לא ב-dict בזיכרון (BE-005 ב-iron rules).

**BE-005** — 2026-06-19: `Body` מ-fastapi לא מיובא by default — יש להוסיפו ל-import אם משתמשים ב-`body: dict = Body(...)`. חלופה: `await request.json()` (pattern קיים בקוד).

**BE-006** — 2026-06-19: ה-client של anthropic הוא `client` (לא `anthropic_client`) — מאותחל בשורה 105: `client = anthropic.Anthropic(timeout=25.0)`.

**BE-007** — 2026-06-19: `/api/marketplace/assist` — endpoint חדש לFilter Assistant. model: `claude-haiku-4-5-20251001`, max_tokens: 800, rate limit: 20/min. demo fallback: keyword-based matching. כולל MG-005, rate limit, JSON strip, score-filter, sort descending.

**BE-008** — 2026-06-22: Season logic — 2 עונות בלבד: summer (Apr-Sep) ו-winter (Oct-Mar). "Winter year" = שנת ינואר (Winter 2026 = Oct 2025 – Mar 2026). `_season_date_range("winter", 2026)` מחזיר `(2025-10-01, 2026-03-31)`. Helper `_compute_wrapped_summary` הופרד — מקבל date window, משמש גם wrapped וגם season/current ו-seasons/archive.
