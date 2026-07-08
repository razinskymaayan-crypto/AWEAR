# Handoff — what Maayan's session changed (2026-07-05 → 07-08)

Read this before you keep working — a lot of the engine changed. Every change is on `main`,
verified, and pushed. Grouped by area.

## 🔴 ACTION NEEDED FROM YOU (Carmel)
**The manager lanes fail auth in ~2 seconds with no output** — the `CLAUDE_CODE_OAUTH_TOKEN`
GitHub secret (your token) looks **expired or exhausted**. steve/mark exit 1 instantly, not on
a session-limit message (the graceful-skip correctly classified it as non-quota). 
**Fix:** re-run `claude setup-token` on your account and update the secret at
`Settings → Secrets → Actions → CLAUDE_CODE_OAUTH_TOKEN`. Until then, no lane can run.
**I DISABLED `autopilot-managers`** (it was failing every cycle on the bad token and emailing a
failure each time). After you refresh the token: `Actions → autopilot-managers → Enable`.

## 1. Agent engine — reliability
- **6 lanes → 3, strictly disjoint files** (mark=static/*, steve=app.py+data+scripts, ayalon=docs).
  Two lanes can never touch the same file → the 78% merge-conflict failures are gone by construction.
- **Cadence + rotation:** scheduled runs now do **ONE lane per 6h cycle** (rotating mark→steve→ayalon),
  never 3 parallel Claude sessions (that blew the account session limit and spammed failure emails).
- **Graceful skip:** a session/usage limit exits 0 (a quiet skip, retries next cycle) — no failure email.
  A real (non-quota) error still fails loudly.
- **Removed** the old per-lane "self-diagnostic" step that raced to commit debug files to main.

## 2. Tests (was 0 → now enforced)
- `tests/` — pytest suite via FastAPI TestClient (money paths, validation, idempotency, auth, rate-limit).
- **jeff-merge GATE 1.5** runs pytest when app.py/schema.sql/tests/requirements change; **re-installs
  requirements AFTER the merge** (a lane adding a dep like bcrypt used to be reverted — fixed).

## 3. The SPA is split (important for the design lane)
- `static/index.html` 11,754 lines → **365-line HTML shell** + `static/app.css` + `static/app.js`.
- `check-render.mjs` re-inlines them so the gate still runs the whole SPA. guard_checks / hooks /
  the adversarial reviewer / lane ownership were all updated to point at the 3 files.

## 4. Observability + self-correction (new)
- **`ci-debug/gate-ledger.md`** — every jeff-merge cycle's outcome (merged/reverted/rejected/conflicted)
  is persisted, INCLUDING reverts (previously shredded by `git reset --hard`). This is the real signal.
- **`scripts/self_heal.py`** — runs in jeff-merge each cycle: detects a STUCK repeat (same gate failure
  N cycles in a row) → files a top-priority `[UNRESOLVED]` root-cause task in CI_FAILURES.md + Telegram
  alert. Manager prompt gained a **priority-0 SELF-HEAL** step so the named lane fixes it (may touch the
  failing gate/workflow). Closes the loop that let the bcrypt failure repeat 6× unnoticed.

## 5. Real fixes that landed (via the agents + the gates)
- **steve:** creator wallet showed $0 for every creator (credits keyed by influencer_id, read by IP) → fixed
  + bcrypt password hashing (P1). Both with pytest.
- **mark:** dark-theme relics on the light theme (the "black on black") → light-safe, gabbana 9/10.
- **Maayan (direct):** 2 blank-screen nav bugs (showView('wardrobe'/'onboarding') → real views) + a literal
  `${icon()}` string shipping in static HTML.

## 6. Audit backlog (queued in `.claude/agents/assignments/{steve,mark}.md`)
Fable-5 audit found, still open: IDOR + plaintext-token auth, comments/notifications in-memory (BE-005),
fail-open moderation, app.py monolith; frontend: i18n is decorative, dead emoji-reactions subsystem,
"New post"/stylist stubs, remaining touch-targets <44px, app.js still one 8.7k-line file.

## Where the founders view it
Maayan runs the app in the iOS simulator via a local server (localhost:8000). A hosted link
(Netlify) would remove that dependency — recommended.
