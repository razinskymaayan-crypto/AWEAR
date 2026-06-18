# Learnings — סטיב (CTO) + סאם (Backend)
קרא קובץ זה בתחילת כל session. עדכן אותו בסוף כל session שבו טעית.

---

## L-001 — שינוי שם שדה = שינוי ב-3 שכבות, לא באחת
**מקור:** price_estimate_ils → price_estimate_usd (2026-06-18), חזרה כממצא audit (2026-06-19)
**לקח:** כל rename של שדה חייב לכסות: (1) backend/app.py, (2) frontend/index.html, (3) ה-AI system prompt שמייצר את הערך. fix חלקי שמכסה רק שכבה אחת ייראה "סגור" ויחזור.
**פעולה:** לפני merge של PR עם rename — בצע grep על כל המחרוזת ב-3 המקומות. תיעד תוצאות ב-PR description.

---

## L-002 — audit של CTO = כשל תהליכי, לא הצלחה
**מקור:** steve_retrospective_2026-06-19.md
**לקח:** אם אני יורד לרמת קריאת קוד שורה-שורה כדי למצוא בעיות — זה סימן שהרשת של checklist/review/test מתחתי לא עובדת. הממצאים נכונים, אבל הצורך לעשות את זה בעצמי הוא הבעיה.
**פעולה:** כשאני עושה audit ידני — לשאול: מה בתהליך לא תפס את זה? לתקן את התהליך, לא רק את הבאג.

---

## L-003 — definition-of-done חייב להיות מפורש, לא מובן-מאליו
**מקור:** price_estimate incident, TDZ crash (postmortem_2026-06-17.md)
**לקח:** "הושלם" חייב להיות מוגדר בכתב לפני שמתחילים. לא "כתבתי את הקוד" — אלא "הרצתי X, grep החזיר Y, ה-test עבר Z". בלי definition מפורש, כל סוכן מחליט לעצמו מה "גמור".
**פעולה:** כל task dispatch שאני שולח לאורן/סאם יכיל שדה "definition-of-done" מפורש.

---

## L-004 — Iron Rules קיימים לא מגנים על עצמם
**מקור:** postmortem_2026-06-17.md — הלקח על TDZ תועד, לא הופנם
**לקח:** Iron Rule שנכתב אחרי תקרית לא מגן אוטומטית מהתקרית הבאה. צריך מנגנון שאוכף אותו — לא הבטחה שכולם יזכרו.
**פעולה:** לכל Iron Rule חדש — להגדיר מי האוכף ואיך הוא נבדק (Playwright, grep, checklist item). כלל ללא מנגנון = המלצה, לא כלל.

---

## לקחי סאם (Backend Developer)

### SAM-L001 | 18.06.2026 | rename שדה ב-backend = לא לגעת לפני grep על callers
**מקור:** price_estimate_ils → price_estimate_usd שבר 54 מקומות ב-frontend. תועד כ"הבעיה שג'ף תפס" — וחזר.
**לקח:** לפני כל rename של Pydantic field, JSON key, ו-endpoint path — מריצים `backend-rename-safety` skill ועושים grep על שם הישן ב-`static/index.html` ו-`mobile/`. לא commit לפני תוצאות ה-grep בידיים.
**מנגנון:** rename → grep callers → grep system prompts ב-app.py → commit. בסדר הזה תמיד.

### SAM-L002 | 19.06.2026 | learnings.md שלא קיים = מנגנון שלא עובד
**מקור:** הקובץ הזה לא היה קיים. SAM-L001 היה ידוע, והבאג חזר.
**לקח:** קובץ שנזכר ב-instructions אבל לא קיים — אינו מנגנון. חייבים ליצור אותו בסשן הראשון ולא להניח שהוא קיים.
**מנגנון:** אם יש רשימה שה-instructions אומרים "קרא", בדוק קודם שהיא קיימת.

### SAM-L003 | 19.06.2026 | אוטונומיה מלאה = יוזמה, לא המתנה
**מקור:** סשן שלם ללא dispatch, ללא יוזמה. rate limiting, logging, auth — כולם פתוחים.
**לקח:** "אוטונומיה מלאה" בתחום backend אינה "מבצע כשמקבל dispatch". היא אחריות על בריאות התשתית. חוב טכני ברור (rate limiting, structured logging) ללא dispatch = proposal לסטיב, לא שקט.
**מנגנון:** תחילת כל cycle — שואל: "מה החוב backend הכי בוער?" אם קיים ואין dispatch — יוזם proposal.
