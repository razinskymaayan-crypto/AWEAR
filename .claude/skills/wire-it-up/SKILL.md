---
name: wire-it-up
description: "File exists" is not "feature connected". Use after creating any new CSS file, i18n file, API field, config, or endpoint to verify the system actually uses it. Covers link tags, t() calls, frontend field reads, and import chains.
---

# Wire It Up — Verify the Connection, Not Just the File

## The pattern that burned us (multiple incidents)

| What was created | What was missing | Impact |
|-----------------|------------------|--------|
| `static/tokens.css` | Not linked in `static/index.html` | Token system had zero effect on the app |
| `static/i18n/en.json`, `he.json` | 0 usages in any JS | 614 hardcoded Hebrew strings remained |
| `result.mode` field in `/api/analyze` | Frontend never read `result.mode` | API ran in demo mode silently — users never knew |
| `awear-tokens.json` | accent colors were reversed vs. live app | RN pipeline would have launched with wrong brand colors |

**The common thread:** A file was created, described as "done", and merged — but it was never
wired into the system that was supposed to use it. "Done" means a user or the system *experiences*
the change, not that a file exists.

## The wire-it-up checklist

Run this after creating **any** of the following:

### CSS file (tokens, component styles)
```bash
# Is it linked in index.html?
grep -n "tokens.css\|your-file.css" static/index.html
# If not found → add <link rel="stylesheet" href="/static/your-file.css">
```

### i18n / translation file
```bash
# Does any JS actually call the translation function with keys from this file?
grep -rn "t(\|i18n\|getString" static/ mobile/ | grep -v ".json" | head -20
# Zero results = the file exists but nothing reads it
```

### New API response field
```bash
# Does the frontend read this field?
grep -n "result\.mode\|response\.yourField\|data\.yourKey" static/index.html | head -10
# Zero results = field is returned but silently ignored
```

### New JSON config / token file
```bash
# What files actually import or reference it?
grep -rn "awear-tokens\|your-config" mobile/ static/ tools/ | grep -v ".json"
```

### New backend endpoint
```bash
# Is it called from anywhere in the frontend?
grep -n "/api/your-endpoint" static/index.html | head -5
```

## Verify values match reality

Creating the file is one thing. Its values must also match what's actually running.

```bash
# tokens.css claims --bg is X. Does the running app use X?
grep -n "\-\-bg" static/tokens.css static/index.html
# Compare. If they differ, tokens.css is wrong, not index.html.
```

For design tokens: `docs/DESIGN_STANDARDS.md` is the canonical truth. Tokens must match it.
The running app (`static/index.html` inline styles) is not the source of truth — the standard doc is.

## The definition of "done"

A feature is done when:
1. The file/code exists ✓
2. It is imported / linked / called by the system that should use it ✓
3. You can observe the effect in the running app (browser or curl) ✓

If you can't do step 3 — it's not done, it's staged.
