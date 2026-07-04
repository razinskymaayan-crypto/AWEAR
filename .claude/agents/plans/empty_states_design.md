> ⚠️ הפניות במסמך זה ל-DESIGN_STANDARDS התיישנו — המקור העדכני: docs/VISUAL_VISION.md. תוכנית אב: .claude/master/MASTER_PLAN.md.

# Empty States Design Guide

**כיוון:** מארק | **תאריך:** 2026-06-19 | **ביצוע:** דולצ'ה | **QA:** גבאנה

---

## עיקרון
Empty state ≠ skeleton. skeleton = loading. empty = no content.

אלה שני states שונים לחלוטין — אין להחליף ביניהם.

---

## Pattern (כל מסך)
1. icon: `icon('X', 48)`, color: `var(--muted)`
2. title: `var(--t-h2)`, `var(--fg)`, bold
3. body: `var(--t-body)`, `var(--muted)`, max 2 שורות
4. CTA: אופציונלי — primary button להוסיף content

---

## מסך → icon + copy + CTA

| מסך | icon | title | body | CTA |
|-----|------|-------|------|-----|
| Feed (0 posts) | `'image'` | "הפיד ריק" | "עקבי אחרי משתמשים לראות תוכן" | — |
| Wardrobe (0 items) | `'hanger'` | "הארון ריק" | "צלמי לוק ראשון" | "פתחי מצלמה" |
| Profile (0 posts) | `'camera'` | "עדיין לא העלת לוקים" | "שתפי את הסגנון שלך" | "הוסיפי לוק" |
| Marketplace (0 items) | `'bag'` | "אין פריטים" | "היי הראשונה למכור" | — |
| Notifications (0) | `'bell'` | "אין עדכונים" | "כאן יופיעו likes ותגובות" | — |

---

## ויזואל

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}
.empty-state .es-icon { color: var(--muted); margin-bottom: 8px; }
.empty-state .es-title { font-size: var(--t-h2); font-weight: 700; color: var(--fg); text-align: center; }
.empty-state .es-body { font-size: var(--t-body); color: var(--muted); text-align: center; max-width: 240px; }
```

---

## אסור בהחלט
- אין emoji בempty state hero (DS-006: icon system קיים — להשתמש בו)
- אין "null" / "undefined" גלויים (OW-002)
- אין spinner — empty state ≠ loading

---

## הוראות לדולצ'ה

לפני כל כתיבה של empty state:
1. בדקי שה-icon קיים ב-`ICONS` object — אם לא, הוסיפי SVG path (DS-007)
2. כל copy דרך i18n key — אין hardcoded strings (MB-003)
3. DS-004: כל `var()` עם fallback

לפני review request לגבאנה — self-check (DS-002):
- `grep emoji` = 0
- `grep hardcoded` = 0
- CTA button: `minHeight: 44px`, `var(--accent)` (DS R-004)

---

## הוראות לגבאנה (QA checklist)

P0:
- [ ] אין emoji ב-hero
- [ ] אין "null"/"undefined" גלויים
- [ ] אין spinner
- [ ] icon קיים ב-ICONS object (לא CDN חיצוני)
- [ ] כל טקסט דרך i18n (grep Hebrew hardcoded = 0)

P1:
- [ ] CTA button `minHeight: 44px`
- [ ] `max-width: 240px` על `.es-body`
- [ ] `gap: 12px` בין אלמנטים
- [ ] שאלת העל: "יעלה ב-Instagram story?" (DESIGN_STANDARDS.md)
