# Wardrobe Screen — Visual Design Brief

**תאריך:** 2026-06-19
**מאת:** מארק (Head of Design)
**עבור:** דולצ'ה (ביצוע), גבאנה (QA)
**הקשר:** WardrobeScreen.js stub קיים (מיזוג feat/wardrobe-screen-stub, commit 1c97217). spec זה מגדיר את השכבה הויזואלית שמעל ה-stub הקיים.

---

## מה זה

הארון האישי — כל הלוקים שהמשתמש צילם. Grid של PostCards.
דף פרופיל-לייט שמשמש גם כ-inventory אישי. המשתמש רואה את עצמו כאן כפי שאחרים יראו אותו.

---

## P0 — structure

- Header: "הארון שלי" `var(--t-h1)`, + מספר לוקים `var(--muted)` inline
- Grid: 2 columns, `gap: var(--space-2)`, `padding: var(--space-3)`
- כל cell: PostCard (per `agents/plans/post_card_design.md` spec — aspect-ratio 4/5, border-radius 12px, width 100%)
- Empty state: per `agents/plans/empty_states_design.md` — `icon('camera', 48)`, "עדיין לא העלת לוקים", CTA "פתחי מצלמה" → navigate('Camera')

---

## P0 — stats bar (מתחת ל-header)

| stat | value |
|------|-------|
| לוקים | N |
| עוקבים | N |
| עוקב/ת | N |

```css
.wrd-stats {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-4);
}
.wrd-stat-val {
  font-size: var(--t-h2);
  font-weight: 700;
  color: var(--fg, #fbfbfd);
}
.wrd-stat-lbl {
  font-size: var(--t-micro);
  color: var(--muted, #8a8498);
  text-transform: uppercase;
  letter-spacing: .04em;
}
```

כל `.wrd-stat` הוא `display:flex; flex-direction:column; align-items:center;` — label מתחת לערך.
ערכים בשלב הנוכחי: hardcoded מ-MOCK_PROFILE (stub). API `/api/users/{user_id}/stats` קיים (commit 7e31acf) — חיבור Cycle 3.

---

## P0 — filter row

"כל הלוקים" | "אחרונים" | "שמורים"

```css
.wrd-filter {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
}
.wrd-filter::-webkit-scrollbar { display: none; }

.wrd-chip {
  padding: 6px 14px;
  border-radius: var(--r-pill, 22px);
  font-size: var(--t-sm);
  background: var(--card, #1e1a22);
  color: var(--muted, #8a8498);
  border: 1px solid var(--line, #2e2836);
  min-height: 32px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.wrd-chip.active {
  background: var(--accent, #e8526a);
  color: var(--fg, #fbfbfd);
  border-color: transparent;
}
.wrd-chip:active {
  transform: scale(0.95);
}
```

הערות ל-DS-004: כל `var()` מגיע עם fallback. `--r-pill` = 22px (per `agents/plans/style_chips_spec.md` — DS scale 10/16/22px). chip active color = `var(--accent)` לא `#fff` (per style_chips_spec.md — active=var(--accent), text=var(--fg)).

---

## P1 — PostCard interaction

- long-press → context menu: "מחקי", "שתפי", "שמרי"
- swipe-left (mobile) → "מחקי" red reveal (`background: var(--danger, #e8526a)`, icon('trash', 20), color var(--fg))

context menu: bottom sheet pattern (consistent עם `openSellForm` ב-web). לא alert() native.

---

## Tokens בשימוש

| element | token | fallback |
|---------|-------|---------|
| header text | `var(--t-h1)` | 24px |
| stat value | `var(--t-h2)` | 20px |
| stat label | `var(--t-micro)` | 11px |
| chip font | `var(--t-sm)` | 13px |
| chip bg | `var(--card)` | #1e1a22 |
| chip border | `var(--line)` | #2e2836 |
| chip active | `var(--accent)` | #e8526a |
| muted text | `var(--muted)` | #8a8498 |
| chip radius | `var(--r-pill)` | 22px |
| grid gap | `var(--space-2)` | 8px |
| grid padding | `var(--space-3)` | 12px |
| stats padding | `var(--space-3) var(--space-4)` | 12px 16px |

---

## מה לא לגעת (P0)

- אין emoji ב-UI chrome — `icon()` calls בלבד (DS-006)
- אין grid תמונות raw — רק PostCard component (per post_card_design.md spec)
- אין hardcoded `#hex` — רק `var()` עם fallback (DS-004)
- אין `font-size` hardcoded — רק `var(--t-*)` (DS-001)
- אין חיבור ל-API stats בCycle זה — MOCK_PROFILE בלבד עד Cycle 3 (MB-002 dependency)
- אין שינוי ב-PostCard component עצמו — זה בscope של post_card_design.md, לא spec זה

---

## Gabbana QA Checklist

לפני כל merge של WardrobeScreen:

1. `grep "emoji\|✓\|✗\|📸\|👗" wardrobe` = 0 (web + mobile)
2. `grep "font-size" wardrobe | grep -v "var(--t-"` = 0
3. `grep "#[0-9a-fA-F]\{3,6\}" wardrobe | grep -v "var(\|//\|fallback"` = 0
4. stats bar — 3 ערכים גלויים (לוקים/עוקבים/עוקב-ת)
5. filter row — chip.active בsingle-select (רק אחד active בכל עת)
6. empty state — icon + copy + CTA נראים כש-0 לוקים
7. PostCard בgrid — aspect-ratio 4/5 נשמר בשני columns
8. chip `:active` feedback — scale(0.95) גלוי
9. שאלת העל: "היה עולה ב-Instagram story של AWEAR?"

---

## Dispatch לדולצ'ה

**מה:** implement Wardrobe Screen ויזואל לפי spec זה מעל stub הקיים (WardrobeScreen.js, commit 1c97217)
**למה:** Wardrobe הוא "הארון שלי" — המסך שהמשתמש רואה את עצמו. stub ריק עם copy עברי hardcoded ואין ויזואל. spec זה מביא אותו לרף שנראה בפיד.
**מתי:** Cycle 3, אחרי PostCard cleared (post_card_design.md spec) ו-empty_states_design.md cleared
**פורמט תוצר:** קובץ `mobile/screens/WardrobeScreen.js` מעודכן + StyleSheet מלא לפי tokens. self-check DS-002 חתום לפני review request לגבאנה.
**גבולות:** לא לגעת ב-PostCard component (scope נפרד). לא לחבר ל-API stats — MOCK_PROFILE בלבד. לא ליצור קובץ חדש — כל השינויים ב-WardrobeScreen.js הקיים.
**מה לא לעשות:** אין StyleSheet.create עם hex values ישירים — `colors` מ-`mobile/tokens.js` בלבד. אין emoji. אין import של library חיצונית ללא תיאום.
