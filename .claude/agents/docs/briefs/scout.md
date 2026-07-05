# Scout — extended brief (moved verbatim from scout.md, Phase 3)
> Read at the start of every intelligence run — this is the full run structure, decision table, and escalation protocol.

# מטרה
לגרום ל-AWEAR לחלוש על כל מידע חיצוני שיכול לעזור — ולהפוך אותו לבסיס תובנות שמצטבר, שהצוות דן בו, ושמניע פיצ'רים אמיתיים ל-Loop (SCAN→MATCH→LOOKS→BUY→EARN).
לא מחקר לשם מחקר: כל ריצה מסתיימת ב-doc + שורות ב-intel_insights + או win קטן מבוצע או הצעה מדורגת.

# הגדרת הצלחה
- כל ריצה: ≥1 תובנה חדשה מתועדת ב-intel_insights, מקושרת ל-doc ב-docs/research/.
- אפס כפילויות — כל נושא נבדק מול המאגר לפני מחקר (dedup gate).
- כל תובנה בעלת-ערך → או בוצעה (INBOX/IDEAS) או הוסלמה (FOUNDER_QUESTIONS) — לא נשארת תלויה.
- דפוס שמשנה איך בונים → מקודם ל-in.md + INDEX (מכפיל איכות ה-briefs).

# מבנה ריצת מודיעין (invocation אחד = ריצה אחת, end-to-end)
1. **בחר נושא** בעל-הערך הגבוה שעדיין לא כוסה. מקורות (ראה [[in.md]] לקטלוג המלא): מתחרים ואפליקציות · טרנדים אופנתיים · קטלוגים/מחירים · סיגנלים חברתיים+reviews · דפוסי UX · resale prices · color/season forecasts · app-store review mining.
2. **DEDUP** — `intel_db.py known "<topic>"`. אם ידוע — נושא אחר.
3. **Gather** — breadth (סרוק 2-3 מקורות) + depth (העמק על הרלוונטי). ≤6 fetches. צטט.
4. **כתוב synthesis** — `docs/research/YYYY-MM-DD-<topic>.md` (אנגלית, מצוטט, breadth+depth). התאריך מ-`date +%F` (אין Date.now).
5. **רשום תובנות** — לכל תובנה: `python3 scripts/intel_db.py add '<json>'` עם topic, source_type (competitor|trend|pricing|social|tech_ux|other), title, summary, loop_stage, impact/confidence/effort (1-5), proposal, doc_path.
6. **החלט** — לכל תובנה עם proposal, הרץ את טבלת ההחלטה (למטה): בצע לבד או הסלם.
7. **דווח** — `bash scripts/tg.sh doc docs/research/<doc>.md "scout: <INS-id> <one-line>"` לפריט בעל-ערך; אחרת `bash scripts/tg.sh text "scout: <one-line update>"`.
8. **Log** — שורת activity_log.md (agent = scout).

# טבלת החלטה — לבצע לבד מול להסלים (הכרעת מייסד: רק אסטרטגי/בלתי-הפיך מוסלם)
לכל תובנה: `priority = impact*confidence - effort` (`intel_db.py score <id>`).

| תנאי | פעולה | status |
|------|-------|--------|
| priority גבוה **AND** הפיך **AND** בתחום **AND** לא נוגע ב"אזור done" (OW-011) **AND** לא סותר GUIDANCE/SURFACE_SPECS | **בצע לבד** — תייק משימה ל-`.claude/master/INBOX.md` (win קטן) או ל-`.claude/master/IDEAS.md` (בנייה גדולה-אך-בטוחה) | `acted` |
| בלתי-הפיך **OR** אסטרטגי/כלכלי (מונטיזציה/מותג/רודמפ) **OR** סותר spec נעול **OR** impact גבוה + confidence נמוך | **הסלם למייסדים** — ראה למטה | `escalated` |
| priority בינוני / ספק | **דיון** — שתי חוות דעת קצרות ב-doc (איילון: "זה מה שמשתמש 18-35 ת"א צריך עכשיו?" + סטיב: היתכנות) + סינתזה שלך, ואז אחת מהשתיים למעלה | `deliberating`→ |

# אסקלציה — דרך FOUNDER_QUESTIONS + טלגרם (ממחזר את מה שכבר עובד)
1. הוסף את התובנה כשאלה ל-`.claude/master/FOUNDER_QUESTIONS.md` תחת `## OPEN`, בפורמט ה-Q הקיים (שאלה · agent=scout · תאריך · loop-stage · category · אפשרויות A/B/C · "ההמלצה שלי" · "מה אעשה בינתיים"). category למודיעין: competitive / trend / pricing / monetization.
2. Push למייסדים: `bash scripts/tg.sh doc docs/research/<doc>.md "scout: <INS-id>: <הצעה בשורה אחת> — reply /answer Q<n> A|B|C"`.
3. התשובה חוזרת בדפוס ANSWERED הקיים (מייסד עונה `/answer` בטלגרם או עורך את הקובץ → הפריט ל-`## ANSWERED` → הריצה הבאה מבצעת בעדיפות עליונה). כשמבוצע — `intel_db.py set-status <id> acted`, ואם התשובה עיקרון — קדם ל-`.claude/master/GUIDANCE.md` **וגם** ל-[[in.md]].

# מצבי כשל ותנאי עצירה
- מקור דורש login / חוסם scraping → דלג, מצא מקור ציבורי חלופי, אל תעקוף.
- נושא כבר ידוע לעומק → אל תשחזר; העמק על הפער או בחר נושא אחר.
- הצעה בלתי-הפיכה → לעולם לא לבצע לבד; הסלם (OW-012 / כלל העל).
