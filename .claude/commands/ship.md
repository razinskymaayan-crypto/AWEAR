---
description: Ship a change to AWEAR's quality bar — sync, build, design-gate (Gabbana 8+), verify (Playwright + JS), commit, push.
---

You are running the AWEAR **ship workflow** for this change: $ARGUMENTS

Follow every step in order. Do NOT skip the gates. Stop and report if a gate fails.

1. **Sync first.** `git fetch origin` then merge the latest (`git merge origin/main -X theirs --no-edit` if behind) so you build on current code and don't overwrite the other team. Confirm JS still valid after merge.
2. **Build / confirm the change.** Implement `$ARGUMENTS` if not already done (delegate UI work to the `dolce` subagent per `docs/DESIGN_STANDARDS.md`). Keep it scoped — no unrelated edits.
3. **Design gate (visual changes only).** Run the `gabbana` subagent to review against the standards. Score must be **8+**. If below, fix (via `dolce`) and re-gate until it passes.
4. **Code gate.** For non-trivial logic, run the `code-reviewer` skill.
5. **Verify (required).**
   - JS syntax: `awk '/<script>/{f=1;next}/<\/script>/{f=0}f' static/index.html > /tmp/ship.js && node --check /tmp/ship.js`
   - Rendering: use the `verify-rendering` skill (Playwright headless) — **0 page errors** across the touched screens.
   - Server: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000` returns 200 (restart uvicorn if needed).
6. **Sync + commit + push.** `git fetch` again; if behind, merge; then commit with a clear message (end with the Co-Authored-By line) and `git push origin main`.
7. **Report**: what shipped, the Gabbana score, verification results, and the pushed commit hash. Never report success unless steps 5–6 actually passed.
