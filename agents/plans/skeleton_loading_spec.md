# Skeleton Loading — Product Spec

**Author:** Ayalon (Product Director)
**Date:** 2026-06-19
**Owner לביצוע:** דולצ'ה
**Priority:** P1 — cycle הבא
**מקור:** critique_cycle_1_ayalon.md → gap analysis; UX research R-001 (micro-interactions P0)

---

## הבעיה

Pollinations API איטי (2-4 שניות). כרגע: ריבועים ריקים. חוויה: נשברת.

משתמשת 18-35 שנכנסת לפיד ביום ראשון רואה ריק. אין שום סימן שמשהו בדרך. היא יוצאת. זה churn בonboarding שניתן למנוע ב-CSS.

---

## הפתרון

Skeleton screens — animated placeholders שנראים כמו תוכן בטעינה.

---

## איפה נדרש (עדיפות יורדת)

1. **Shopping Feed** — כרטיסי outfit בטעינה (P1 קריטי — first impression)
2. **Wardrobe items** — grid של פריטים בארון
3. **Marketplace cards** — בrowse tab
4. **Profile screen** — תמונות avatar + posts grid

---

## הגדרת skeleton

```css
.skeleton {
  background: var(--card);
  background-image: linear-gradient(
    90deg,
    var(--card) 0%,
    var(--surface) 50%,
    var(--card) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: inherit;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Shape:** זהה לcard האמיתי — אותו aspect ratio, אותו border-radius. skeleton שנראה שונה מהתוכן שיחליף אותו יוצר layout shift ומרגיש שגוי.

**Tokens בלבד:** `var(--card)` ו-`var(--surface)` — לא hex values. fallback חובה לפי DS-004.

---

## מה skeleton הוא לא

skeleton = מצב "בטעינה". כשהAPI מחזיר — skeleton מוחלף בתוכן.

**הבחנה קריטית:**
- skeleton → בטעינה → נעלם כשהתוכן מגיע
- empty state → אין תוכן בכלל → נשאר. לא מוחלף בskeleton.

**אין להציג skeleton על empty state.** אם הפיד ריק (אין פוסטים) — זה empty state, לא skeleton. ריבועים שמבצבצים לנצח על פיד ריק = חוויה שבורה גרועה יותר מריבועים ריקים.

---

## מימוש — flow מצופה

```
component mounts
  └→ מציג skeleton placeholders (מיידי)
       └→ API call
            ├→ success: מחליף skeleton בתוכן אמיתי (fade-in)
            └→ error / empty: מסיר skeleton, מציג empty state
```

**timing:** skeleton מופיע frame ראשון. לא אחרי 500ms delay.

---

## definition of done

- skeleton מופיע מיידית ב-mount (frame 1, לא אחרי delay)
- shimmer animation רץ בזמן הטעינה
- skeleton מוחלף בתוכן אמיתי כשהAPI מחזיר
- skeleton לא מחליף empty state — empty state מוצג כשאין תוכן
- aspect ratio ו-border-radius של skeleton זהים ל-card האמיתי (אין layout shift)
- tokens בלבד (`var(--card)`, `var(--surface)`) — אין hex values
- Playwright test: skeleton נראה בframe הראשון → נעלם אחרי load

---

## מה לא בscope

- skeleton בChat / Abigail — טעינה שם היא לא API images, behavior שונה
- skeleton ב-onboarding screens
- גרסת skeleton לdark/light mode שונות — tokens מטפלים בזה אוטומטית

---

## נקודת כשל עיקרית

skeleton שנראה שונה מה-card האמיתי → layout shift כשהתוכן מגיע → תחושת "דף קפץ". זה גרוע מriבועים ריקים. דולצ'ה: ודאי שה-skeleton wrapper מקבל את אותם dimensions של הcard הסופי לפני שמתחילים.

---

*Ayalon | Product Director | AWEAR | 2026-06-19*
