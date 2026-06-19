# Hardcoded Hex Audit — Cycle 1 Baseline

**תאריך:** 19.06.2026
**כלי:** `grep -Eo "#[0-9a-fA-F]{3,6}" static/index.html`

## Top 20 ערכים:
| hex | count | token קיים | הערה |
|-----|-------|------------|------|
| #fff | 58 | אין — `var(--text)` (#fbfbfd) קרוב ביותר | pure white — לא בפלטה. דורש החלטה: האם `--fg` מחליף? |
| #4ade80 | 22 | אין | ירוק Tailwind — מחוץ למערכת לחלוטין. migration → `var(--success)` (#52c97a) |
| #1a1030 | 13 | `var(--bg)` / `var(--surface)` | P0 — hallucinated color. דולצ'ה תיקנה חלק (P0-1 בcycle 1), 13 נותרו |
| #2a2040 | 9 | `var(--card)` | P0 — hallucinated color. נותרו 9 |
| #fbfbfd | 8 | `var(--text)` | alias קיים בtokens.css — migration ישיר |
| #34d399 | 8 | אין | ירוק Tailwind — מחוץ למערכת. → `var(--success)` |
| #fbc2eb | 6 | אין | gradient decorative — לא בפלטה. P2 לcycle עתידי |
| #a18cd1 | 6 | אין | סגול Tailwind — לא בפלטה. P2 |
| #ef4444 | 5 | `var(--danger)` (#e05252) | קרוב אבל לא זהה — migration → `var(--danger)` |
| #000 | 5 | `var(--bg)` (#0e0c0f) | שחור מוחלט — לא בפלטה. → `var(--bg)` |
| #fbbf24 | 4 | `var(--warning)` (#e8a84a) | קרוב — migration → `var(--warning)` |
| #b8b8c4 | 4 | `var(--muted)` (#8a8498) | קרוב — migration → `var(--muted)` |
| #201540 | 4 | `var(--card)` | hallucinated — variant של #2a2040 |
| #f87171 | 3 | `var(--danger)` | Tailwind red-400 — → `var(--danger)` |
| #f59e0b | 3 | `var(--warning)` | Tailwind amber — → `var(--warning)` |
| #20202b | 3 | `var(--surface)` | → `var(--surface)` (#161318) |
| #111 | 3 | `var(--bg)` | → `var(--bg)` |
| #ff9a8b | 2 | אין | gradient decorative — P2 |
| #ff99ac | 2 | אין | gradient decorative — P2 |
| #ff6a88 | 2 | אין | gradient decorative — P2 |

## סה"כ הופעות hardcoded hex: 247

## target cycle 2: 124 (ירידה של 50% — מ-247 ל-≤124)

## P0 להחלפה ראשונה — cycle 2:
1. `#1a1030` — 13 הופעות → `var(--bg)` / `var(--surface)` (hallucinated, אין justification)
2. `#2a2040` — 9 הופעות → `var(--card)` (hallucinated, P0 מ-DS-001)
3. `#fff` — 58 הופעות → `var(--text)` לטקסט, `var(--fg)` לעיצוב — דורש הבחנה לפי context

## הערות:
- `#4ade80` ו-`#34d399` (30 הופעות ביחד) — Tailwind greens שאין להם token מקביל. לפני migration יש לבדוק אם הם בsuccess context (→ `var(--success)`) או decorative (→ token חדש).
- `#fff` (58 הופעות) — הערך הנפוץ ביותר. context בדרך כלל: color:white על dark bg. migration → `var(--fg)` תתן #f0ecf5 (off-white) — שינוי ויזואלי קל, אך נכון לפלטה. דורש screenshot comparison.
- gradient decoratives (`#fbc2eb`, `#a18cd1`, `#ff9a8b`, `#ff99ac`, `#ff6a88`) — נצרכות review של מארק לפני שנחליט על token חדש או הסרה.

## cycle-opening grep — Cycle 1:
`grep -c "var(--t-" static/index.html` = **0** (ראה DS-001 בlearnings.md)
target cycle 2: עולה (migration מתחיל)
