# Autonomous pipeline — who runs what

(Moved verbatim from root CLAUDE.md, Phase 1 of the foundation overhaul. Load on demand — needed only when working on workflows/automation.)

- **Engine**: `.github/workflows/autopilot.yml` — ריצה כל ~15 דק', עובד על branch `auto/engine` (לא על main!)
- **Lanes**: `autopilot-managers.yml` — 6 lanes מקביליים (mark/steve/oren/ayalon/scout/gabbana) על `auto/<lane>`, כל 30 דק'
- **Strategy**: `strategy.yml` — מחלקת אסטרטגיה אוטונומית (tobi/anna/bernard/amancio), יומי עד סגירת חידות 05-08 ואז שבועי, על `auto/strategy`
- **Merge gate**: `jeff-merge.yml` — **הדרך היחידה ל-main**: build + guard_checks + ביקורת אדברסרית בפרסונות (Gabbana לעיצוב, Steve לקוד). דחייה → `ci-debug/jeff-rejections.txt` והסוכן מתקן בריצה הבאה
- **Learning**: `retrospective.yml` יומי — חייב לכתוב סקציה יומית ל-`knowledge/LEARNING_LOG.md` או שהריצה נכשלת
- **Telegram**: הכל דרך `scripts/tglib.py` (canonical: chunking 4096, retries, 429, לוג כשלים ב-`.claude/telegram_failures.log`). `tg.sh` ו-`telegram_send.py` הם wrappers דקים — לא להוסיף curl ישיר
- **Kill switch**: `.agents_paused` בשורש הריפו משבית את כל ה-workflows האוטונומיים.
