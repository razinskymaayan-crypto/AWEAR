# Spacing Audit — Cycle 2
**תאריך:** 2026-06-19
**מבצע:** נטה
**worktree:** /Users/tamargrosz/netta-spacing (feat/spacing-tokens)

## מצב נוכחי

- hardcoded spacing values ב-index.html: **366**
- שימוש קיים ב-`var(--sp-*)`: **0**
- tokens.css: `--sp-*` קיים מ-cycle 1, `--space-*` נוסף ב-cycle 2

זהו OW-005 מחזור: token system קיים ולא בשימוש.

---

## ערכים ב-8pt grid — mapping לtokens

| value | count (padding) | count (gap) | count (margin) | total | target token |
|-------|-----------------|-------------|----------------|-------|-------------|
| 4px   | 17              | 8           | 4              | 29    | `var(--space-1)` / `var(--sp-4)` |
| 8px   | 15              | 47          | 0              | 62    | `var(--space-2)` / `var(--sp-8)` |
| 12px  | 27              | 17          | 1              | 45    | `var(--space-3)` / `var(--sp-12)` |
| 16px  | 24              | 2           | 0              | 26    | `var(--space-4)` / `var(--sp-16)` |
| 20px  | 6               | 0           | 0              | 6     | `var(--space-5)` / `var(--sp-20)` |
| 24px  | 4               | 0           | 0              | 4     | `var(--space-6)` / `var(--sp-24)` |
| 32px  | 2               | 0           | 0              | 2     | `var(--space-8)` / `var(--sp-32)` |
| 40px  | 5               | 0           | 0              | 5     | `var(--space-10)` / `var(--sp-40)` |
| 48px  | 1               | 0           | 0              | 1     | `var(--space-12)` / `var(--sp-48)` |

**סה"כ on-grid:** ~180 הופעות — ניתנות למיגרציה ישירה.

---

## ערכים off-grid — דורשים החלטה לפני מיגרציה

אלה ערכים שאינם על ה-8pt grid. חלקם הגיוניים (half-steps), חלקם noise.

| value | count | הערה | המלצה |
|-------|-------|------|-------|
| 2px   | 5     | hairline — גיטים, separators | `var(--sp-2)` — קיים |
| 6px   | ~35   | half-step בין 4 ו-8 | `var(--sp-6)` — קיים, מותר |
| 10px  | ~45   | half-step בין 8 ו-12 | `var(--sp-10)` — קיים, מותר |
| 14px  | ~30   | בין 12 ל-16 — off-grid | בדוק context: chip padding → `--sp-12`, list item → `--sp-16` |
| 5px   | ~17   | off-grid | המר ל-`--sp-4` או `--sp-6` לפי context |
| 7px   | ~15   | off-grid | המר ל-`--sp-8` ברוב המקרים |
| 9px   | ~11   | off-grid | המר ל-`--sp-8` ברוב המקרים |
| 11px  | ~13   | off-grid | המר ל-`--sp-12` ברוב המקרים |
| 13px  | ~6    | off-grid | המר ל-`--sp-12` |
| 18px  | ~10   | off-grid | context-dependent: component padding → `--sp-16` |
| 22px  | ~2    | off-grid | המר ל-`--sp-20` |
| 28px  | ~2    | קיים ב-grid (--sp-28) | `var(--sp-28)` |
| 60px  | ~4    | off-grid | קרוב ל-`--sp-64` — בדוק context |
| 100px | ~1    | off-grid — suspicious | audit בודד — likely layout-specific value |

---

## תכנית מיגרציה — Cycle 3

### P0 — On-grid values (migration trivial, ~180 occurrences)
אלה ניתנים למיגרציה ללא החלטה עיצובית:
- `8px` → `var(--space-2)` — 62 הופעות, רובן gap
- `12px` → `var(--space-3)` — 45 הופעות, רובן padding
- `4px` → `var(--space-1)` — 29 הופעות

### P1 — Half-step values (קיימים ב-tokens, migration possible)
- `6px` → `var(--sp-6)` — ~35 הופעות
- `10px` → `var(--sp-10)` — ~45 הופעות

### P2 — Off-grid values (דורשים audit per-context)
- `14px`, `5px`, `7px`, `9px`, `11px`, `13px` — כל אחד דורש:
  1. בדיקה ויזואלית של הcomponent
  2. החלטה אם לעגל למעלה/מטה
  3. תיעוד הסיבה

---

## ערכים שלא יהיו ב-tokens — edge cases

| value | count | סיבה |
|-------|-------|------|
| 100px | 1     | likely layout-specific (bottom-nav clearance), לא spacing token |
| 60px  | 4     | חוץ מה-grid — audit context לפני החלטה |
| 56px  | 1     | קרוב ל-`--sp-48` — בדוק |
| 50px  | 1     | off-grid, audit |

---

## כלל אכיפה — Cycle 3+

כל PR שמוסיף `padding:`, `gap:`, `margin:` עם value מפורש (לא token) — rejected עם:
```
ספציפי: השתמש ב-var(--space-4) במקום padding:16px
```

---

## DoD verification

```
grep -n "var(--space-" /Users/tamargrosz/netta-spacing/static/tokens.css | wc -l
→ 9 (--space-1 through --space-12, skip 7/9/11)
```

cycle-opening grep לcycle 3:
```
grep -c "var(--sp-" static/index.html   # baseline: 0
```
target: עולה.
