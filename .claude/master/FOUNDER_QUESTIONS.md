# FOUNDER QUESTIONS — daily steering loop

**Why this file exists:** agents must NOT guess product direction and build things that later get
reverted. When an agent hits a fork it cannot resolve from a locked spec, it **asks here** and works
on something else meanwhile. Once a day Carmel/Razi answer; answered items become directives that
top the backlog. Then the loop repeats. (OW-012)

**The daily cadence:**
1. Agents append direction questions to `## OPEN` as they work (with options + a recommendation).
2. The founders answer **at the start of a session with the assistant** (a SessionStart hook surfaces
   open questions, and the assistant raises them), or in Telegram. Each answer moves to `## ANSWERED`.
3. Agents execute `## ANSWERED` directives at top priority (after a broken build), then mark them
   `[done]` and move them to `## ARCHIVE`.

## Before you ask (so "err toward asking" doesn't become noise)
1. Try to resolve the fork yourself, in order: **MASTER_PLAN → docs/SURFACE_SPECS.md →
   `.claude/master/GUIDANCE.md`**. If any of them answers it, do NOT ask.
2. Only a genuinely unresolved **direction** fork becomes a question. (When still unsure after the
   three sources — **err toward asking** rather than guessing and getting reverted.)
3. Don't ask things you can resolve sensibly yourself (naming, micro-UX, obvious defaults) — decide
   and log those.

## Compounding (this loop gets cheaper over time)
When a founder answer states a **reusable principle** (not a one-off), the assistant/Jeff appends a
one-line rule to the matching section of `.claude/master/GUIDANCE.md`. That class is then resolved by
GUIDANCE and never asked again.

## Stale questions
An OPEN question that sits unanswered gets pushed to the founders' Telegram by the daily report
(`scripts/founder_questions_nudge.sh` via `daily-report.yml`) until answered.

---

## How agents write a question (format)
```
### Q<n> — <one-line question>  ·  <agent>  ·  <YYYY-MM-DD>  ·  loop-stage: SCAN|MATCH|LOOKS|BUY|EARN|—  ·  category: product|design|scope|economics
What I'm blocked on: <1-2 sentences — the fork I can't resolve from MASTER_PLAN/SURFACE_SPECS/GUIDANCE>
Options:
  A) <option>  — <consequence>
  B) <option>  — <consequence>
  C) <option>  — <consequence>
My recommendation: <A/B/C + one-line why>
What I'll do meanwhile: <the other task I picked so I'm not idle>
```

## How founders answer
Edit the question's block, add a line `ANSWER (Carmel/Razi, <date>): <the direction>`, and move the
whole block to `## ANSWERED`. Or reply in Telegram with `/answer Q<n> <direction>`. If the answer is a
reusable principle, also promote it to `.claude/master/GUIDANCE.md` (compounding).

---

## OPEN (need founder direction)

### 2026-07-06 · Tobi (strategy riddle 05 — unit economics)
1. **[קריטי — לפני פגישת המשקיע]** תיקון מספרי ה-deck: "contribution ~$11/user/month" לא שורד diligence (המתמטיקה הכנה: $0.20-0.40 revenue/MAU/month ב-Phase 1; ‏$11 נכון רק per transacting user). אופציות: (א) להשאיר כמו שזה; (ב) framing כן — ‏"$2.98 net/attributed order, ‏~80% GM, מסלול מדורג" + תחזית M18 מתוקנת ($60-160K ARR base case). **המלצה: (ב)** — המודל הכן חזק יותר מול משקיע. פירוט: `.claude/master/strategy/05-unit-economics.md`.
2. **[Phase 3, לא דחוף — החלטה נעולה #9]** עמלת resale ‏15% מול שוק שהתכנס ל-Depop ‏0% / Vinted buyer-pays ‏~5%. אופציות: (א) להשאיר 15%; (ב) buyer-pays ‏7-10%; (ג) hybrid ‏15% עם קרדיטים מוגדלים. **המלצה: (ג).** לא דורש הכרעה לפני הגיוס — כן כדאי תשובה מוכנה אם משקיע שואל.
3. **[Phase 2]** אישור עקרוני ל-AWEAR Pro ‏$5.99/mo כ-tier בתשלום (scan בסיסי לעולם חינם). **המלצה: כן** — זה מנוע ה-margin הראשון (StyleDNA כבר גובה $7.99-19.99).

---

## ANSWERED (directives — execute at top priority, then archive)
_(empty — founders move answered items here)_

---

## ARCHIVE (done)
_(completed directives move here with a one-line note)_
