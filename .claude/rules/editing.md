# Editing discipline (all agents, all files)

- **Grep before Read** — for large files (`static/index.html` ~11.8k lines, `app.py` ~4.1k lines): grep the target first, then Read only the relevant range with `offset`+`limit`. Line numbers in docs are hints, not truth; grep is the truth.
- **Trust the Edit tool** — it errors on failure. Do NOT re-read a file after editing to verify.
- **Grep to verify, not Read** — `grep -n "your_change" file` costs ~10 tokens; re-reading costs thousands.
- **Skills before big-file edits** — `spa-navigation` for index.html, `backend-patterns` for app.py, `backend-rename-safety` before ANY rename.
- **Worktrees** — parallel work on shared files only via worktrees under `AWEAR/worktrees/` (never `~/`), per `worktree-discipline` skill.
- **TDZ** — in index.html, global `const`/`let` must be declared before the first `renderXxx()` call (`js-tzdead-zone` skill).
- **icon()** works only inside JS template literals — never in static HTML (use inline SVG there).
