---
name: backend-rename-safety
description: Use BEFORE renaming any field, endpoint, key, or data structure in app.py or schema.sql — fire the moment a rename is discussed or planned, not after. Prevents silent breakage across static/index.html and mobile/ (the price_estimate_ils→usd incident broke 54 callers with no console errors). NOT needed for brand-new fields/endpoints with no existing consumers — use backend-patterns for those.
allowed-tools: Read, Grep, Glob, Bash
---

# Backend Rename Safety Checklist

## What happened (2026-06-18 Board Sync)

Sam renamed `price_estimate_ils` → `price_estimate_usd` in `app.py`. The backend was updated
correctly. But `static/index.html` referenced `price_estimate_ils` in **54 places** — every price
display, CPW calculation, filter threshold, and sort logic. All of them broke silently.

The frontend never throws an error when a field is missing — it just shows `undefined`, `NaN`,
or blank. Users would have seen broken price displays with no console errors.

Sam's own brief said: "check frontend before finalizing a backend proposal." It didn't happen.

## The rule

> Before renaming any field, key, endpoint, or data structure in `app.py` or `schema.sql`,
> grep every consumer — `static/index.html`, `mobile/`, `tools/` — and count the hits.
> If count > 0, the rename is a two-part commit: backend + all callers, atomically.

## Step-by-step

### 1. Count all usages before touching anything

```bash
# Search everywhere a human would use this field
grep -rn "price_estimate_ils\|your_field_name" \
  static/index.html \
  mobile/ \
  tools/ \
  .claude/agents/ \
  --include="*.js" --include="*.html" --include="*.py" --include="*.md"
```

Record the count. If it's > 0, this is a **multi-file change**.

### 2. Plan the rename atomically

Do not rename the backend field and merge before updating callers.
Either:
- Update backend + all callers in the same commit, OR
- Add a compatibility alias in the backend that returns BOTH old and new keys during transition,
  merge that first, then update callers, then remove the alias.

### 3. After the rename — verify no stragglers

```bash
# Old name should be gone everywhere except git history and comments
grep -rn "price_estimate_ils" static/index.html mobile/ tools/
# Should return 0 results
```

### 4. Check data-derived logic, not just display

The price_estimate incident had a hidden logic bug: CPW threshold comparisons were written with
values calibrated to ILS (₪), not USD. A field rename doesn't fix the logic — the numbers were
wrong too. After a rename, grep for:

```bash
# Find hardcoded thresholds near the renamed field
grep -n "CPW\|threshold\|> 50\|< 100\|cost_per_wear" static/index.html | head -20
```

Ask: are these numbers still valid with the new field's units/scale?

### 5. Schema renames — check the live schema, not schema.sql

`schema.sql` is a PostgreSQL aspirational schema — the live SQLite tables are the
`CREATE TABLE IF NOT EXISTS` statements inside `init_db()` in `app.py` (`grep -n "CREATE TABLE" app.py`).
A column rename means: `init_db()` + every `db.execute(...)` touching that column + all frontend/mobile consumers.

### 6. For endpoint renames

```bash
# Find all fetch/axios calls to the old endpoint
grep -rn "api/old-endpoint\|/analyze\|/your-path" static/index.html mobile/ | head -20
```

Mobile and web may call the same endpoint — check both.

## The principle

Integration is your job description. "Backend change" is never self-contained in a full-stack
app. Assume every field name is used somewhere in the frontend until grep proves otherwise.
