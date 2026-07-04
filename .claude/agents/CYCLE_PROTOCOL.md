# AWEAR Work Cycle Protocol

> **עיקרון הבסיס:** תמיד אפשר לשפר הכל. "הושלם" = "טוב יותר ממה שהיה." לא קיצי.

---

## מבנה כל Cycle

### Phase 1 — PLAN (ג'ף + מארק + איילון + וראן)
**משך:** Board Sync קצר — output בלבד, לא דיון פתוח.

**חובות:**
- איילון: טבלת scope (מה זז / לא זז / חסם)
- מארק: 3 עדיפויות עיצוביות לcycle הזה
- וראן: סטטוס מובייל + 2 עדיפויות
- ג'ף: שאלת פתיחה — "מה צריך להתקבל רק היום?"
- ג'ף: אם עלתה שאלה עסקית (supply/growth/moat/economics) — dispatch חידה לסוכן האסטרטגיה המתאים (Amancio/Anna/Bernard/Tobi → מסמך ל-`.claude/master/strategy/`, אישור: כרמל)

**תוצר:** `agents/plans/cycle_{N}_plan.md` עם dispatch ברור לכל IC.

---

### Phase 2 — BUILD (ICs בworktrees מבודדים)

**IC teams:**
| צוות | סוכנים | תחום |
|------|--------|------|
| Frontend | דולצ'ה | UI, screens, components |
| Design System | נטה | tokens, typography, icons |
| Backend | סאם + אורן | API, integration |
| Social | שירה | comments, moderation, reactions |
| Mobile | דנה + רועי | RN screens |

**כללים:**
- כל IC עובד ב-worktree מבודד (Iron Rule #14)
- קרא לפני שמתחיל: `.claude/agents/knowledge/OW.md` + קובץ הדומיין שלך (`ds`/`be`/`mb`/`sf`/`mg`) — או grep את `.claude/agents/knowledge/INDEX.md` לקוד ספציפי
- תוך 48 שעות — commit ראשון נראה-לעין, לא draft

---

### Phase 3 — CRITIQUE (קבועים — תמיד אותו צוות)

**הנחת היסוד:** תמיד יש מה לשפר. הצוות מחפש — לא מחכה שיפגוש בעיה.

**צוות הביקורת:**

| מבקר | מה הוא בודק | כיצד |
|------|-------------|------|
| **גבאנה** | עיצוב + visual quality | audit לפי VISUAL_VISION.md (חלק ט׳) + שאלת העל: "יעלה ב-Instagram/Pinterest/Zara story?" |
| **סטיב** | קוד + ארכיטקטורה | checklist: SQL injection, TDZ, inline styles, 3-layer coverage |
| **איילון** | חוויית משתמש + scope | "האם זה מה שמשתמשת 18-35 ת"א צריכה עכשיו?" |
| **מארק** | כיוון עיצובי + עקביות | "האם זה עקבי עם design language שהגדרנו?" |

**פורמט ממצאים:** כל מבקר כותב קובץ `agents/logs/critique_cycle_{N}_{name}.md` עם:
```
P0 — חייב לתקן לפני merge
P1 — לתקן בcycle הבא
P2 — לשקול, לא דחוף
GOOD — מה עבד טוב (חובה! למידה דו-כיוונית)
```

---

### Phase 4 — ITERATE (על בסיס ממצאי P0)

- P0 items → dispatch מיידי לIC הרלוונטי
- IC מתקן, גבאנה מאמתת
- אין merge ל-main ללא P0 clearance

---

### Phase 5 — MERGE + LEARN

- ג'ף מוזג PRs שקיבלו clearance
- לקח חדש → **3 צעדים, לא אחד** (אחרת הלמידה לא מתקמפלת):
  1. כתוב את הלקח בקובץ הדומיין `.claude/agents/knowledge/{ds,be,mb,sf,mg}.md` עם הקוד הבא בסדרה (פורמט `### XX-NNN | כותרת`)
  2. הוסף שורה ל-`.claude/agents/knowledge/INDEX.md` (למידה שלא ב-INDEX = למידה שלא תיקרא)
  3. entry ב-`agents/activity_log.md` שמצטט את הקוד
- **Cycle N+1 מתחיל**

---

## Intelligence Lane — מודיעין רציף (Scout)

> **בעלים:** Scout ([[../scout.md]]) · כפוף לאיילון. **מקורות + כללים:** [[knowledge/in.md]] (IN-001..IN-006). **מאגר:** `intel_insights` דרך `scripts/intel_db.py`.

### Cadence — נתח מובטח, לא מילוי זמן פנוי
המלכודת ההיסטורית: מחקר ישב מתחת להכל וה-INBOX אמר "אל תחקור כל עוד יש משימות" → אפס ריצות מחקר ב-24 סייקלים. התיקון הוא **cadence rule, לא priority tier**:

- **כל ריצה רביעית (~25%)** — אם אין CI-fix פתוח **ואין** ANSWERED directive **ואין** [פתוח] INBOX — היא **ריצת Intelligence** בבעלות Scout, במקום משימת build.
- מבטיח ~רבע מהקיבולת למודיעין בלי לדרוס אף פעם build שבור או directive של מייסד (הם תמיד גוברים).
- ריצת מודיעין: בחר נושא בעל-ערך → **DEDUP** (`intel_db.py known`) → gather (≤6 fetches) → `docs/research/YYYY-MM-DD-<topic>.md` → שורות ב-`intel_insights` → החלט (טבלה למטה) → דווח בטלגרם.

### דיון + הכרעה — לבצע לבד מול להסלים
לכל תובנה עם `proposal`: `priority = impact*confidence - effort` (`intel_db.py score <id>`).

| תנאי | פעולה | status |
|------|-------|--------|
| priority גבוה **AND** הפיך **AND** בתחום **AND** לא "אזור done" (OW-011) **AND** לא סותר GUIDANCE/SURFACE_SPECS | **בצע לבד** → משימה ל-INBOX (win קטן) או IDEAS (בנייה גדולה-בטוחה) | `acted` |
| בינוני / ספק | **דיון** → שתי חוות דעת ב-doc (איילון: "משתמש 18-35 צריך עכשיו?" + סטיב: היתכנות) + סינתזה → אחת מהשורות | `deliberating`→ |
| בלתי-הפיך **OR** אסטרטגי/כלכלי **OR** סותר spec נעול **OR** impact גבוה + confidence נמוך | **הסלם למייסדים** → FOUNDER_QUESTIONS `## OPEN` + `tg.sh doc` push | `escalated` |

> **הכרעת מייסד נעולה:** רק אסטרטגי/בלתי-הפיך מגיע לכרמל+רזי. כל השאר — Scout פועל לבד (רעש נמוך).

אסקלציה ממחזרת את הערוץ הקיים: שאלה ל-FOUNDER_QUESTIONS `## OPEN` (פורמט Q) → `bash scripts/tg.sh doc` למייסדים → תשובה `/answer` חוזרת בדפוס ANSWERED → הריצה הבאה מבצעת בעדיפות עליונה → `intel_db.py set-status <id> acted`, ועיקרון מקודם ל-GUIDANCE + [[knowledge/in.md]].

---

## כלל העל

> **"יש עוד משהו לשפר" — אבל לכוון את זה ללולאה (The Loop), לא לליטוש חוזר של מסכים גמורים.**
> ההנחה "תמיד יש מה לשפר" חלה על קידום ה-WOW (SCAN→MATCH→LOOKS→BUY→EARN מ-seeded ל-real), **לא** על חזרה למסך שכבר טופל. חזרה לאזור גמור = זגזוג (OW-011) — אסור בלי ANSWERED directive או metric.
>
> **יחס לכל cycle:** ≥1 משימה שמקדמת שלב בלולאה · ≤1 משימת polish (הנמוכה ביותר, לעולם לא חזרה לאותו אזור). ה-MVP שעובד נכון מנצח ליטוש תמיד.
>
> גבאנה: "זה נראה טוב יותר — אבל האם זה מקדם את הלולאה או רק מלטש מסך גמור?"
> סטיב: "הקוד עובד — איפה ה-edge case שלא חשבנו עליו?"
> איילון: "המשתמשת תבין את זה — אבל האם זה מקרב את הלולאה לעבוד באמת?"
> מארק: "זה עקבי — אבל האם נגענו פה כבר (זגזוג)? יש spec נעול ב-SURFACE_SPECS?"

---

## Cycle Log

| Cycle | תאריך | Focus | P0 findings | GOOD |
|-------|--------|-------|-------------|------|
| 0 | 19.06.2026 | Foundation: English, token cleanup, camera scaffold | ₪/$ partial fix, emoji in UI, token system unused | buyConfirm cleanup, moderation scaffold |
| 1 | current | Color system, icon system, UX research, product DB, profiles | TBD | TBD |

---

*נוצר: 19.06.2026*
