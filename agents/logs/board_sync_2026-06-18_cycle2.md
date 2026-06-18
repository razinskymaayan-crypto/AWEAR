# Board Sync — Cycle 2 (2026-06-18)

## נוכחים
ג'ף (מכנס) · איילון · סטיב · מארק · וראן · סאם

---

## דוח צוותים — מה בוצע בפועל מאז Cycle 1

| צוות | בוצע | הוכחה |
|------|-------|--------|
| **Mobile (וראן)** | דנה: מסך הרשאת מצלמה (`CameraPermissionScreen.js`) מוזג | commit `134f65f` |
| **Mobile (וראן)** | רועי: Phase 0 i18n (language switch he↔en + RTL) מוזג | commit `00889ca` |
| **Design (מארק)** | דולצ'ה+גבאנה: Phase 2 emoji→icon + Phase 3 עיצוב עריכתי onboarding+home | commits `0afd932`, `d5578b3` |
| **Social (איילון)** | שירה: block-user feature (feed+closets filtering, unblock UI) — cherry-picked ופתרון קונפליקט יד | commit `3bed3a3` |
| **Backend (סאם)** | שינוי שם `price_estimate_ils`→`price_estimate_usd` + קונסטנטות resale/commission | commits `b4c4c33`, `bbae5ab` |
| **i18n rescue** | 60+ מפתחות i18n של רועי (closet+feed) חולצו מ-worktree תקוע ומוזגו ידנית | commit `9017e70` |
| **Worktrees** | 2 worktrees תקועים נוקו (שירה: מוזג, רועי: חולץ) | `git worktree list` = main בלבד |

---

## חסמים שנפתרו מאז Cycle 1

1. **עקיפת worktree** — תוקן: גבאנה נרשמה כ-subagent אמיתי עם `tools:` מוגבל. עדיין תלוי: 11 פרסונות נותרות כקובצי טקסט בלבד.
2. **Worktree splitting** — 2 worktrees נוקו. עדיין תלוי: בדיקת סטיב על שורש הבעיה (worktrees שמסתעפים מ-`290667f` ישן).

---

## החלטות הבורד — Cycle 2

### 1. עדיפות יום — Build Day
כל הצוותים בעבודה עמוקה. אין פגישות עד Board Sync 3.

### 2. משימות מאושרות לשיגור מיידי

| סוכן | משימה | עדיפות | תלויות |
|------|--------|--------|--------|
| **אורן** | Currency display: החלף ₪ ב-$ בכל תצוגות המחיר + recalibrate CPW thresholds (עכשיו שסאם שינה את השם) | P0 | אין — שוגר ראשון |
| **דנה** | Camera preview + capture pipeline: אחרי מצלמה הורשתה, הצג preview חי + כפתור capture | P0 | אין — mobile/ בלבד |
| **סטיב** | רשום 11 הפרסונות הנותרות כ-subagents אמיתיים ב-`.claude/agents/` + חקור שורש worktree-splitting | P1 | אין — `.claude/agents/` בלבד |
| **רועי** | i18n Phase 1: הוסף `t()` helper + wire static HTML nav/onboarding → *(שוגר רק אחרי מיזוג אורן)* | P1 | אחרי אורן |

### 3. אורן ורועי — לא במקביל
שניהם נוגעים ב-`static/index.html`. אורן יוגר ראשון, רועי יוגר אחרי מיזוג.

### 4. מארק / Design
Phase 3 עיצוב עריכתי נמסר. follow-up פתוח: 2 אימוג'י שגבאנה דגלה (P2, לא blocking). מארק מחליט על scope Phase 4.

---

## הצעד הבא
שיגור 3 משימות במקביל: דנה (mobile), סטיב (subagents+investigation), אורן (currency).
לאחר מיזוג אורן → שיגור רועי (i18n Phase 1).
