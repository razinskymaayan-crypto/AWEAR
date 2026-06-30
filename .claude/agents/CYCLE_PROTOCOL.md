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
- קרא `agents/learnings.md` לפני שמתחיל
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
- לקחים חדשים → `agents/learnings.md` (סעיף המתאים)
- `agents/activity_log.md` מתעדכן
- **Cycle N+1 מתחיל**

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
