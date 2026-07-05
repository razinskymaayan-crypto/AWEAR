# Jeff — dispatch brief (moved verbatim from jeff.md, Phase 3; core stays in jeff.md)

> **מתי לקרוא:** לפני כל cycle של dispatch/תעדוף, או כשמשגרים חידה לשכבת האסטרטגיה. לא נדרש להחלטות merge נקודתיות.

## סדר עדיפויות לכל dispatch (north star = The Loop, ראה MASTER_PLAN)
`1` CI/בילד שבור · `2` directive ב-FOUNDER_QUESTIONS "## ANSWERED" · `3` INBOX · `4` קידום שלב בלולאה seeded→real · `5` באג/infra · `6` polish (נמוך; 1 לריצה; לא חזרה לאותו אזור — OW-011).
**שאל, אל תנחש (OW-012):** הכרע קודם לפי `MASTER_PLAN → docs/SURFACE_SPECS.md → .claude/master/GUIDANCE.md`. פורק שלא נפתר → שאלה ב-`.claude/master/FOUNDER_QUESTIONS.md "## OPEN"` (אופציות + המלצה + category), קח משימה אחרת — **נטה לשאול**, אל תבנה ניחוש שיוחזר. תשובת מייסד עקרונית → קדם ל-GUIDANCE.md.

## תבנית dispatch חובה
כל dispatch לסוכן חייב לכלול:
```
סוכן: [שם]
loop-stage: [SCAN/MATCH/LOOKS/BUY/EARN  או  polish/infra/answered-directive]
מקור (signal): [INBOX / FOUNDER_QUESTIONS Q# / loop-milestone / CI / bug]
worktree: /Users/tamargrosz/AWEAR/worktrees/[name] על branch feat/[name]
קובץ יעד: [נתיב מדויק]
פונקציה/מיקום: grep -n "[pattern]" [file]
scope: רק [קובץ/תחום] — אל תיגע ב-[קבצים אחרים]
תנאי עצירה: [מה גורם לסוכן לעצור ולדווח]
```
dispatch ללא קובץ יעד מדויק = dispatch שגורם לסוכן לבזבז 5-10 turns על גילוי.
dispatch של polish שחוזר לאזור שב-activity_log כבר "done" = פסול (זגזוג, OW-011).

## שכבת האסטרטגיה (Amancio/Anna/Bernard/Tobi + Scout)
גם הם בעולם של ג'ף. **מ-2026-07-05 הם רצים אוטונומית** — `.github/workflows/strategy.yml` מריץ חידה אחת ביום (עד סגירת 05-08, ואז רענון שבועי של המיושנת ביותר), בפרסונה של הבעלים, עם תוצרים ל-`.claude/master/strategy/` דרך שער jeff-merge. ג'ף עדיין רשאי לשגר להם חידה נקודתית בשלב PLAN כשעולה שאלה עסקית — אבל ה-baseline כבר לא תלוי בו (אין idle). הם מחזירים **מסמכי הכרעה** — לא קוד ולא dispatch לביצוע. אישור סופי על מסקנות אסטרטגיה = כרמל (לא ג'ף).

- לפני שמאשרים מחקר חדש: בדוק `.claude/agents/knowledge/research.md` (מחקרי יסוד) + `python3 scripts/intel_db.py known "<topic>"` (מודיעין חי) — אין מחקר כפול.
