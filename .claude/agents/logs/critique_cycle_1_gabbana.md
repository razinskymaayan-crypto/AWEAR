# Critique Cycle 1 — Gabbana | 19.06.2026

**commit:** 89efe15 | **screens:** Home, Shopping Feed, Marketplace, Profile/Closet | **breakpoint:** mobile 390px

---

## Color System Check

הפלטה החדשה (rose #e8526a, terracotta #c4855a, bg #0e0c0f) — כיוון נכון. Contrast עובר WCAG AA בכל הצבעים.

**בעיה קריטית:** `#2a2040` ו-`#1a1030` — 12 הופעות עדיין פעילות (שורות 702, 721, 779, 805, 899, 927, 946, 962, 1002, 1029, 1048, 1100, 1173). cold purple על warm dark = visual conflict מוחלט. כלל 3 מ-DESIGN_STANDARDS.md מופר.

**בעיה נוספת:** `--shadow-accent` ב-tokens.css עדיין `rgba(123,92,255,.32)` (סגול ישן) — צריך `rgba(232,82,106,.32)` (rose).

**hardcoded hex נוספים:** `#4ade80`, `#34d399` (green — לא מ-token), `#fbfbfd` (`.sheet-look-emoji` — surface ב-dark mode), `#f472b6`/`#a855f7` (stylist avatar gradients).

---

## Emoji Audit

**47+ מופעי emoji ב-UI chrome.** הדחופים ביותר:

| שורה | מיקום | emoji | תיקון |
|------|--------|-------|--------|
| 2628–2638 | Quick Actions (11 כפתורים) | ✨🛍️💅🧑‍🎨📊💫🛒⚖️🏆🌿📋 | icon() calls |
| 1244–1246 | Shopping Feed tabs | ✨🔥🎯 | icon() + טקסט |
| 2143 | Closet empty state hero | 👗✨ (64px) | icon('hanger', 60) |
| 2146 | Closet CTA button | 📸 | icon('camera', 18) |
| 3963 | Explore wardHits | emoji fallback | productImage(it) |
| 3234 | Marketplace "מכירה שלי" | 👗 | productImage(item) |
| 1284 | Section title | ✨ Outfit Generator | icon('sparkle',16) |
| 2753 | Section title | 👗 לפי קטגוריה | icon('hanger',16) |
| 2766 | Section title | 🔥 הכי נלבש | icon('flame',16) |
| 3148 | Page title | 🛒 Marketplace | icon('bag',16) |
| 2834 | Loading spinner | ✨ | `<div class="spinner"></div>` |
| 4668–4673 | Admin KPI | 👤📸✨📉🛒 | icon() |
| 4730 | Stylists seed avatar | 👩‍🎨✨🖤🌸💼🔥 | initials circle |

`CAT_EMOJI` object (שורה ~1598) — עדיין קיים ובשימוש בשורות 3963, 4991.

---

## Instagram Story Test

| מסך | יעלה? | מה מונע |
|-----|--------|---------|
| Home | ❌ | Quick Actions bar — 11 emoji כbuttons |
| Shopping Feed | ❌ | Tab navigation עם emoji |
| Marketplace browse | ✅ (בתנאי) | productImage מחובר. "מכירה שלי" tab — ❌ |
| Profile/Closet מלא | ✅ (בתנאי) | Empty state emoji מונע את חוויית onboarding |

---

## P0 — חוסם לפני כל PR

1. **`#2a2040`/`#1a1030` → tokens** (12 הופעות) — visual conflict עם פלטה חדשה
2. **Quick Actions 11 emoji → icon()** — הUI chrome הכי גלוי
3. **Closet empty state** — `👗✨` hero + `📸` CTA (first thing new user sees)
4. **Explore wardHits** שורה 3963 → `productImage(it)`
5. **Marketplace "מכירה שלי"** שורה 3234 → `productImage(item)`
6. **Shopping Feed tabs** emoji → icon() + טקסט

## P1 — Cycle הבא

1. `var(--text)` / `var(--bg2)` — 35 הופעות, לא מוגדרים ב-tokens.css החדש (בדוק fallback)
2. `var(--t-*)` — 0 שימושים; 402 font-size hardcoded
3. STYLISTS_SEED avatars → initials circles
4. Loading spinner → CSS spinner
5. Section titles שנשארו עם emoji
6. `#4ade80`/`#34d399` → `var(--success)` (כבר מוגדר)
7. `chat-send-btn` — 42px (מתחת ל-44px minimum)

## P2 — Backlog

- STORIES bar emoji avatars → initials
- `pc-feat-cover` — emoji cover image
- Admin KPI emoji (internal screen)
- `--shadow-accent` → rose rgba
- `font-size: 11.5px` ב-3 מקומות → `var(--t-micro)`
- Weather emoji (debatable — industry norm)

---

## GOOD — מה עבד טוב

1. **Profile/Closet structure** — ה-IG-head section (avatar+name+stats+bio) נקי ומדויק
2. **Icon system קיים ועובד** — `icon('hanger')`, `icon('grid')`, `icon('tag')` כבר מחוברים בsegments
3. **Marketplace browse** — productImage() מחובר, badge מצב עובד
4. **:active states** — 41 מוגדרים, pattern קיים ועקבי
5. **פלטה החדשה** — rose/terracotta, כיוון נכון ומבוסס מחקר
