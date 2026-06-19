# Critique Cycle 2 — Criteria Sheet

**מחברת:** גבאנה (Senior Design Critic, AWEAR)
**תאריך:** 2026-06-19

## כלל input required (DS-003)

כל review request חייב לכלול:
1. commit hash
2. שם מסך ספציפי
3. breakpoint: mobile 390px

ללא שלושת אלה — הבקשה חוזרת לדולצ'ה לפני שגבאנה פותחת את הקובץ.

## P0 Blockers — חייב לעבור לפני merge

| # | בדיקה | פקודה / שיטה | עובר כשמחזיר |
|---|-------|--------------|--------------|
| P0-1 | CAT_EMOJI מסולק | `grep -c "CAT_EMOJI\|CAT_EMOJIS" static/index.html` | 0 |
| P0-2 | "ארונות ציבוריים" header | grep + visual | אין emoji |
| P0-3 | Hardcoded hex #2a2040/#1a1030 | `grep -c "#2a2040\|#1a1030" static/index.html` | 0 |
| P0-4 | Skeleton — frame ראשון | DevTools Slow 3G | shimmer גלוי לפני content |
| P0-5 | Skeleton — layout shift=0 | inspect dimensions | skeleton = card dimensions |
| P0-6 | Skeleton — נעלם עם content | visual | לא גלוי אחרי load |
| P0-7 | Style Chips — מסננות | בחר "Vintage" → ספור | cards פחות + לא שבור |
| P0-8 | "הכל" chip = default | load ראשוני | "הכל" נבחר, כל posts גלויים |
| P0-9 | IG Story Test | visual 4 מסכים | 4/4 pass |

## P1 Checks

| # | בדיקה | פקודה | baseline |
|---|-------|-------|---------|
| P1-1 | Token coverage | `grep -c "var(--t-" static/index.html` | baseline: 0 → target: >0 |
| P1-2 | Skeleton CSS = tokens only | grep skeleton block | אין # values |
| P1-3 | Chips tap target | inspect height | ≥44px |
| P1-4 | Chips horizontal scroll | visual 390px | chips גלויות בגלילה |
| P1-5 | Chips localStorage | בחר → refresh | state נשמר |
| P1-6 | Chips CSS = tokens only | grep chip block | אין # values |
| P1-7 | Skeleton 60fps | DevTools Performance 4x CPU | ≥55fps |
| P1-8 | Chips multi-select | בחר Minimal + Y2K | union, לא ריק |
| P1-9 | פוסטים ללא style_tags | פיד מסונן | לא נעלמים |

## DS-008 Self-Check — דולצ'ה עושה לפני שליחה

| # | שאלה | בדיקה |
|---|------|-------|
| S-1 | emoji חדש? | grep ב-שורות חדשות = 0 |
| S-2 | skeleton CSS hex? | grep skeleton block |
| S-3 | chip CSS hex? | grep chip block |
| S-4 | icon() בstatic HTML? | כל icon() ב-static HTML = P0 |

## פסילה אוטומטית (DS-002)

גבאנה מחזירה מיד ללא full audit אם:
- emoji חדש ב-UI chrome
- hex חדש שאינו token
- skeleton שלא מוחלף בcontent
- chip שמשנה צבע אבל לא מסנן

## שאלת העל

"אם AWEAR הייתה מפרסמת screenshot מהמסך ב-Instagram story — האם הייתה מתביישת?"

תשובה חובה: `Visual QA: עבר / לא עבר — [סיבה]`
