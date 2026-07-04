> ⚠️ הפניות במסמך זה ל-ICON_SYSTEM התיישנו — המקור העדכני: docs/VISUAL_VISION.md. תוכנית אב: .claude/master/MASTER_PLAN.md.

# Cycle 2 — Product Roadmap

**תאריך יעד:** 3 ימים מעכשיו (יעד: 2026-06-22)
**מטרת Cycle:** האפליקציה תיראה ותרגיש כמו product אמיתי — לא demo

---

## P0 — BootReady (חייב להיות ב-Cycle 2)

| # | פיצ'ר | owner | spec |
|---|-------|-------|------|
| 1 | Skeleton Loading — Feed + Wardrobe | דולצ'ה | agents/plans/skeleton_loading_spec.md |
| 2 | Style Filter Chips | דולצ'ה | agents/plans/style_chips_spec.md |
| 3 | React Navigation install + Tab Bar | רועי + דנה | agents/plans/mobile_cycle2_backlog.md P0 |
| 4 | Moderation live (ANTHROPIC_API_KEY set) | סטיב + שירה | agents/plans/moderation_thresholds_proposal.md |

**הערת P0:** פריטים 1+2 הם web; פריטים 3+4 הם mobile/backend. אין תלות ישירה ביניהם — ניתן לרוץ במקביל. סדר עבודה: 1+2 יוצאים לדולצ'ה מיד. 3 מחכה לאישור ג'ף ב-Board Sync לפי mobile_cycle2_backlog.md.

---

## P1 — Cycle 2 High Value

| # | פיצ'ר | owner | הערה |
|---|-------|-------|------|
| 5 | FeedScreen → /api/posts | רועי | תלוי ב-sam/feat/cycle-1-backend merge. endpoint `/api/posts` קיים (commit 8305516). fallback: 3 hardcoded cards מ-Cycle 1. |
| 6 | WardrobeScreen stub (+ Camera flow) | דנה | MB-004: navigate('Wardrobe', { newImageUri }) כבר עובד. stub חייב לקבל URI ולהציג Image + placeholder. |
| 7 | Section title emoji cleanup | דולצ'ה | ICON_SYSTEM.md. DS-006 חוב מ-Cycle 1. |
| 8 | Loading spinner → CSS class | דולצ'ה | P1-4 מביקורת גבאנה. |
| 9 | --t-* typography migration (first 20 שורות hardcoded) | נטה | OW-005. grep baseline נרשם ב-Cycle 1: 402 שורות. Cycle 2 target: 382. |

**הערת P1:** פריט 5 ו-6 הם mobile — ממתינים לאישור וראן לפי MB-002. פריטים 7+8 web — מגיעים לדולצ'ה אחרי שP0-1 ו-P0-2 מושלמים.

---

## P2 — Backlog (לא ב-Cycle 2)

| # | פיצ'ר | owner | למה לא עכשיו |
|---|-------|-------|------|
| 10 | STYLISTS_SEED avatars → initials | דולצ'ה | ויזואלי בלבד, לא חוסם שום flow |
| 11 | WishlistScreen stub | רועי | מסך 5. Tab Bar תחילה. |
| 12 | Image upload flow Camera → API | דנה | WardrobeScreen stub קודם. upload = Cycle 3. |
| 13 | #4ade80/#34d399 → var(--success) | נטה | חוב ידוע — כשeמוכן לצאת Cycle 2 ב-P1 migration, צורף. |
| 14 | look_total_usd שורה 2305 (fallback ILS/USD) | אורן + סאם | דורש החלטת schema. BE-002. |
| 15 | ProfileScreen stub | דנה | P1 ב-mobile_cycle2_backlog אך תלוי ב-Tab Bar ב-P0 מוגמר. |

---

## שאלות פתוחות — decision required לפני build

### 1. Marketplace tabs
**שאלה:** כמה tabs? מה ה-sort default?

**ניתוח:**
- 3 אפשרויות: "הכל / מכירה / החלפה" (לפי transaction type) או "חדש / מחיר עולה / מחיר יורד / קרוב אלי" (לפי sort) או שניהם.
- Depop ו-Vinted: sort default = "הכל", tabs = categories.
- AWEAR בשלב bootstrap: מלאי קטן. tabs לפי category יראו ריקים. sort default = Newest תחילה — מביא תחושת "דבר קורה".

**הצעה:** שלושה tabs: "הכל / חדש / נמכר" (status). Sort default: Newest. לא מרחק — location data לא קיים עדיין.

**מי מחליט:** איילון. נדרש ב-Board Sync לפני dispatch.

---

### 2. Profile page — scope MVP
**שאלה:** האם user רואה stats (posts sold, viewed, liked)?

**ניתוח:**
- Stats מחייבים data pipeline: sold count (אין backend logic), viewed count (אין tracking), liked count (קיים: _likes_store ב-commit f829c78).
- Stats ב-MVP שאינם אמיתיים = אמון שבור. "12 מכירות" עם data לא אמיתי גרוע מהיעדרם.

**הצעה:** MVP Profile = avatar + username + bio + כפתור follow בלבד. stats row: רק likes count (נתון קיים). sold + viewed = Cycle 3 אחרי שbuild ה-data pipeline. תיעוד זה כחוב מפורש ב-backlog.

**מי מחליט:** איילון. מאושר כאן.

---

### 3. Notifications — מתי?
**שאלה:** Cycle 2 או Cycle 3?

**ניתוח:**
- push notifications מחייב: FCM/APNs setup, device token management, notification schema, permission flow.
- אין מהן תלות ב-Cycle 2 flow אחר.
- cost: יום+ של setup. benefit: משתמשת חדשה ב-Cycle 2 לא תקבל notification ממה שעוד לא קיים.

**הצעה:** Cycle 3. אין action item ב-Cycle 2. לתעד ב-backlog בלבד.

**מי מחליט:** איילון. מאושר כאן.

---

## הגדרת הצלחה — Cycle 2

| קריטריון | מדד | כיצד נבדק |
|---------|-----|-----------|
| "יעלה ב-Instagram story?" | 4/4 מסכים עוברים (vs 2/4 עכשיו) | גבאנה: screenshot audit בסוף cycle |
| FlatList גולל בלי jank | getItemLayout תקין + removeClippedSubviews | Metro bundle + manual scroll test |
| Moderation פועל בפועל | curl test חי, לא fallback | שירה: curl + תיעוד response |
| Skeleton מופיע frame 1 | frame 1, לא אחרי delay | Playwright test (spec) |
| Filter chips מסננים בפועל | פיד משתנה לפי selection | Playwright test (spec) |
| Tab Bar עם 5 מסכים | כל tab מנווט למסך stub | Metro bundle EXIT 0 |

---

## Board Sync — scope table (לפי MG-004 + PR-001)

טבלה זו פותחת את Board Sync ב-Cycle 2. לא סיכום — action.

| סוכן | scope Cycle 2 | status נוכחי | חסם | action |
|------|--------------|--------------|-----|--------|
| דולצ'ה | P0-1 skeleton, P0-2 chips, P1-7 emoji, P1-8 spinner | ממתין ל-dispatch | אין | dispatch מיד אחרי Board Sync |
| רועי | P0-3 React Navigation (infra), P1-5 FeedScreen→API | ממתין ל-dispatch | תלוי ב-sam merge | וראן מאשר לאחר Board Sync |
| דנה | P0-3 Tab Bar, P1-6 WardrobeScreen stub | ממתין ל-dispatch | תלוי ב-Navigation install רועי | רועי קודם, דנה שני |
| סטיב + שירה | P0-4 Moderation live | ANTHROPIC_API_KEY לא set | API key חסר | ג'ף: set key ב-env לפני dispatch |
| נטה | P1-9 typography migration (20 שורות) | baseline נרשם | אין | dispatch מיד אחרי Board Sync |
| אורן | P2-14 look_total_usd שורה 2305 | ממתין להחלטת schema | סאם חייב להחליט על schema | סאם: החלטה ב-Board Sync |

**כלל stall:** 48 שעות בלי commit = action item מפורש. לא הערה. לא "נבדוק". וראן אוכף על mobile IC; איילון מדווח ב-Board Sync הבא.

---

## תלויות ו-critical path

```
Board Sync
  └→ dispatch דולצ'ה (P0-1, P0-2) — מיידי
  └→ ג'ף: set ANTHROPIC_API_KEY → dispatch שירה+סטיב (P0-4)
  └→ וראן מאשר → dispatch רועי (P0-3: Navigation install)
       └→ רועי: Navigation done → dispatch דנה (P0-3: Tab Bar + WardrobeScreen)
            └→ דנה: Tab Bar done → dispatch דנה (P1-6: WardrobeScreen stub)
  └→ sam merge feat/cycle-1-backend → dispatch רועי (P1-5: FeedScreen→API)
```

---

## כלל העל של Cycle 2

"הושלם" = definition of done עבר בפועל. לא "קוד קיים". לא "נראה טוב". OW-002 חל על כל פריט.

---

*Ayalon | Product Director | AWEAR | 2026-06-19*
