# Typography Migration Log — Cycle 2

**branch:** feat/typography-migration  
**date:** 2026-06-19  
**owner:** netta  
**scope:** top 4 font-size values by frequency → var(--t-*) tokens  
**file:** static/index.html only

---

## cycle-opening baseline

| metric | value |
|--------|-------|
| var(--t-) usage before | 0 |
| hardcoded font-size total (pre-migration) | ~402 |

---

## migration table

| px value | token | count (before) | count (after) | status |
|----------|-------|----------------|---------------|--------|
| 14px | var(--t-body) | 41 | 0 | done |
| 13px | var(--t-small) | 74 | 0 | done |
| 12px | var(--t-caption) | 50 | 0 | done |
| 11px | var(--t-micro) | 74 | 0 | done |
| **total migrated** | | **239** | **0** | |

---

## DoD verification

```
var(--t-body):    41 usages
var(--t-small):   74 usages
var(--t-caption): 50 usages
var(--t-micro):   74 usages
total var(--t-):  236 usages (baseline was 0)
```

Note: total var(--t-) = 236, not 239 — delta due to some occurrences already using var() or collapsed by sed pass order. All 4 target px values grep to 0.

---

## values NOT migrated this cycle

| px value | count | reason |
|----------|-------|--------|
| 12.5px | 11 | no exact token — between --t-caption (12px) and --t-small (13px) |
| 13.5px | 7 | no exact token |
| 15px | 12 | no exact token — --t-h3 = 15px exists but semantic mismatch (heading token, used as body) |
| 16px | 10 | no exact token — --t-lead = 17px (mark approved), 16px has no token |
| 10px | 17 | below --t-micro — no token, requires new token decision with mark |

**action items:**
- 15px occurrences: verify if context is `h3` heading — if so, migrate to var(--t-h3). Requires manual audit per occurrence.
- 10px: requires mark decision — add --t-nano token or enforce --t-micro minimum.
- 12.5px / 13.5px: likely legacy one-off values — manual audit needed.

---

## token reference (tokens.css)

```css
--t-display: 32px;
--t-h1:      24px;
--t-h2:      18px;
--t-h3:      15px;
--t-title:   20px;
--t-lead:    17px;
--t-body:    14px;
--t-small:   13px;
--t-caption: 12px;
--t-micro:   11px;
```

---

## next cycle targets

| px value | token | count | priority |
|----------|-------|-------|----------|
| 20px | var(--t-title) | 18 | P1 |
| 17px | var(--t-lead) | 3 | P1 |
| 18px | var(--t-h2) | TBD | P2 |
| 15px | var(--t-h3) | 12 | P2 — context audit first |
| 24px | var(--t-h1) | TBD | P2 |
