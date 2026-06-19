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

---

**הערה:** audit רץ לפני merge של fix/cycle-1-p0-visual.
לאחר merge (commit 4cd0156 — דולצ'ה): `#1a1030=0`, `#2a2040=0`.
אומת: `grep -c "#1a1030\|#2a2040" static/index.html` → **0** (19.06.2026).
הנתונים בטבלה למעלה (13 ו-9 הופעות) משקפים את ה-snapshot שלפני התיקון — שמורים כbaseline היסטורי.

## Cycle 2 Migration — #4ade80 / #34d399 → var(--success):
**תאריך:** 19.06.2026 | **branch:** feat/success-token-migration
**DoD:** `grep -c "#4ade80\|#34d399" static/index.html` → **0**
- נוסף `--success-dark: #22c55e` ל-tokens.css (gradients/hover)
- 30 הופעות הוחלפו — כולן success/earning context. אין gradients דקורטיביים שנשארו
- rgba של הgreens הישנים (rgba(74,222,128,X) ו-rgba(52,211,153,X)) עודכנו ל-rgba(82,201,122,X) תואם --success
- #86efac (lighter grade tier) — נשאר בכוונה: מייצג tier בינוני-גבוה בscale (≥60), נפרד מ-var(--success) (≥80)
