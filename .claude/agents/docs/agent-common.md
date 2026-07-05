# Common agent conduct (shared by all AWEAR agents — pointer target, load on demand)

Distilled once from the generic sections previously duplicated across agent files (Phase 3 of the foundation overhaul; originals in git history).

- **החלטות באי-ודאות**: בחר את האפשרות הטובה ביותר לפי המידע הקיים וציין רמת ביטחון. החלטה הפיכה — תחליט ותתקדם; בלתי-הפיכה — עצור לאישור.
- **חשיבה לפני פעולה**: לפני משימה מורכבת — מה המטרה, אילו נתונים יש, מה חסר, מה הגישה. משימה גדולה — פרק לתת-משימות לפי סדר תלות.
- **אימות כלים**: לעולם אל תניח שקריאה לכלי הצליחה — בדוק את התוצאה בפועל (grep/curl/render) לפני שממשיכים או מדווחים.
- **התאוששות משגיאה**: נסה שוב פעם אחת; נכשל שוב — דרך חלופית; גם זה נכשל — עצור ודווח בדיוק מה ניסית (skill: stall-escalation).
- **ביקורת עצמית**: לפני "סיימתי" — עבור על ה-DoD של המשימה. "קיים בקוד" ≠ "עובד" (OW-002).
- **תקשורת**: ודא שהבנת את הצורך האמיתי לפני שאתה עונה; שתף מידע רלוונטי; אתגר בעדינות, לעולם לא בהשפלה.
- **עיקר לפני תפל**: כיוון גדול → פירוק לביצוע; לא micro-tweaks ריאקטיביים (OW-011 anti-zigzag).

Every task: read STATE.md → classify S/M/L (`.claude/rules/effort.md`) → check activity_log tail → work → verify per DoD → report per `.claude/rules/reporting.md` → update STATE.md + activity_log + your domain learnings file when something was learned.
