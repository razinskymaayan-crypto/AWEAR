---
description: Safely pull & integrate the other team's latest work without overwriting it, then verify the app still runs.
disable-model-invocation: true
---

You are running the AWEAR **sync workflow**. Goal: integrate the latest `origin/main` (the other founder's team works in the same repo) without losing either side's work.

1. **Check local state.** `git status -s` — note any uncommitted changes. If there are meaningful local edits, commit them first (clear message) so the merge is clean.
2. **Fetch + report.** `git fetch origin`; show new remote commits (`git log --oneline HEAD..origin/main`) and whether they touched `static/index.html` / `app.py` (`git diff --stat HEAD origin/main -- static/index.html app.py`).
3. **Merge non-destructively.** `git merge origin/main --no-edit`. If conflicts are few, resolve each preserving **both** intents. If many, prefer the other team's version in conflicts (`-X theirs`) so you never overwrite their features — you re-apply your own piece (e.g. English translation) afterward.
4. **Protect secrets.** Confirm `.gitignore` still ignores `.env`, `.tg_*`, `venv312`, `data/awear.db` (`git check-ignore .env`); restore it if it was removed upstream.
5. **Verify.** JS syntax check on `static/index.html`; restart uvicorn and confirm `http://localhost:8000` returns 200; if the merge touched rendering, run the `verify-rendering` skill (0 errors).
6. **Push** the merge commit so both teams stay in sync.
7. **Report**: new commits pulled, any conflicts and how resolved, verification result, and current HEAD.
