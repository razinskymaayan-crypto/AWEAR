# AWEAR Foundation Audit & Upgrade — AUDIT_REPORT

> Living document. Updated at the end of every phase with before/after, assumptions, unknowns, effort log, and deletions.
> Companion files: [STATE.md](STATE.md) (resume point), [NEEDS_DECISION.md](NEEDS_DECISION.md) (human decisions), [TEMPLATE_BOUNDARY.md](TEMPLATE_BOUNDARY.md) (company-specific content log).

## Phase 0 — Inventory, diagnosis & unknowns map (DONE 2026-07-05)

### Method
3 parallel research subagents (`.claude/` ecosystem map; repo/code/CI map; git-history failure mining) + direct verification of high-stakes claims by the main session.

### Assumptions (P1)
- Agents remain paused (`.agents_paused`) for the duration of the overhaul — safe to edit workflows/agents.
- Local main is the working branch for infra commits (matches recent history); no push without founder ask.
- Master-prompt structures are adapted (not duplicated) onto the existing learning-code system where they overlap.

### Unknowns identified → resolution
| Unknown | Resolution |
|---|---|
| Are secrets committed to git? | **Resolved by investigation: NO.** `.env`, `client_secret_*.json`, `google_credentials.json`, `venv312/`, `node_modules/` all gitignored + untracked. Subagent claim was a false positive (on-disk ≠ tracked). |
| Is git history bloated with images? | **Resolved: NO.** Only 324 tracked files, ~7MB of images. No history rewrite needed. |
| Is `data/awear.db` tracked? | **Resolved: YES** — tracked despite `.gitignore` entry (added before ignore). Fix in Phase 9 (`git rm --cached`). |
| Which LEARNING_LOG is canonical (root `knowledge/` vs `.claude/agents/knowledge/`)? | To verify in Phase 5. |
| Exact model-routing options available in agent frontmatter | To verify in Phase 3 (haiku/sonnet/opus/inherit). |
| Human decisions | Logged in NEEDS_DECISION.md with defaults applied. |

### What exists (summary)
- **Auto-loaded context per session ≈ 5,900 tokens**: CLAUDE.md ~2,140 + SessionStart hook (full knowledge INDEX.md + 5 activity-log lines) ~3,020 + MEMORY.md ~740. Peak with agent brief + plan lookups much higher, but on-demand.
- **Config ecosystem**: 20 agent personas (~220K total, avg 11K each — far above the ~30-line target), 13 skills (good descriptions, no frontmatter beyond description), 2 commands, 2 SessionStart hooks + 1 PreToolUse guard (Edit/Write only — Bash unguarded), settings.local.json with `bypassPermissions`.
- **Knowledge system (strength — preserve)**: 652 lines of incident-driven learning codes (OW-001..012, BE, DS×18, MB, SF, MG, IN) with central INDEX. No harmful duplication found; layering is intentional.
- **Code**: app.py 4,058 lines / 63 endpoints, monolith; static/index.html 11,754 lines; mobile/ dormant since 2026-06-28; schema.sql says "PostgreSQL" but runtime is SQLite.
- **Tests/lint: NONE.** Only Playwright render check (`scripts/check-render.mjs`) + grep-based `guard_checks.sh` in jeff-merge. No pytest, no ruff/eslint, no pre-commit.
- **CI**: 9 workflows — autopilot engine (auto/engine), 6 manager lanes (auto/<lane>, */30), strategy (daily), jeff-merge (only gate to main), retrospective (daily), telegram-poll (*/2 min), daily-report, whoami (debug, deletable), loop-liveness.

### What's duplicated
- Iron Rules prose exists in CLAUDE.md AND `daily_model.md` AND (partially) knowledge files — none hook-enforced locally.
- SPA/backend orientation in CLAUDE.md duplicates `spa-navigation` and `backend-patterns` skills.
- Role quick-starts in CLAUDE.md duplicate agent persona files.

### What's bloated
- SessionStart hook injects the FULL knowledge INDEX (~3,020 tokens) every session — the single biggest auto-load leak.
- Agent files avg ~11K bytes each (inline domain knowledge).
- `.claude/agents/logs/` — 32 stale files (~540K) from 2026-06-17..19, unreferenced.
- Stale worktree debris under `.claude/worktrees/`; 23 stale local feat/* branches.

### What's missing
- STATE.md / DECISIONS.md / notes/ (no resume point, no ADR log) — being created now.
- Any automated test or lint gate; eval sets; uniform reporting protocol; effort-tier policy; Bash-destructive-command guard.

### What's dead
- `whoami.yml` workflow (debug, self-described as temporary), `setup_google_auth.py` (one-off), `.claude/agents/logs/` (archive candidates), 23 merged feat/* branches. Deletions deferred to Phase 9 and logged here when executed.

### Top 10 failure/waste patterns from git history (evidence-based, ranked)
1. **auto/* lane merge conflicts** — 6 unresolved in 5 days (`ci-debug/jeff-conflicts.txt`); lanes diverge without rebase-on-main.
2. **Status/debug commit noise** — 45 `[skip ci]` + 33 "debug: mgr X status" commits ≈ 15% of 90-day volume; belongs in CI artifacts.
3. **Infra exists ≠ used (OW-005)** — ~402 hardcoded font-sizes / ~226 hex values vs ~35 `var(--t-*)` uses despite a full token system.
4. **Rename breaks 3 layers (OW-001/BE-001)** — `price_estimate_ils→usd` broke 54 frontend callers silently; skill exists but invocation not enforced.
5. **"Done" ≠ verified (OW-002)** — zero automated tests; moderation shipped never curl-tested; CameraScreen button with no onPress.
6. **Seed-data integrity drift** — 40 feed posts remapped after orphaned product ids (BE-TAG-INTEGRITY, 2026-07-04).
7. **Quota burn from aggressive cadence** — telegram-poll */2min; `fix(ci): revert over-aggressive cadence (burned Actions minutes)`; agents paused 2026-07-05 for quota burn.
8. **Learning loop half-broken** — knowledge codes are rich when humans correct (6-7 rules per founder UX pass) but LEARNING_LOG under-populated by autonomous runs.
9. **Grep-detectable violations recur unenforced** — emoji in chrome (DS-006/008), i18n hardcoding (MB-003), handler/render class mismatch (OW-008); all catchable by a PostToolUse hook, none caught before merge gate.
10. **Branch/worktree debris** — 23 stale feat/* branches, stale worktrees, tracked `ci-debug/` churn commits.

### Effort log (P5)
| Phase | Est. | Actual | Notes |
|---|---|---|---|
| 0 | 3 subagents + verification | 3 subagents + 1 bash verification | One false-positive security claim caught by direct verification — lesson: subagent findings that drive drastic action must be re-verified in main context. |
| 1 | main-context edits only, ~6 files | 8 files, no subagents | Under estimate. |

## Phase 1 — CLAUDE.md pruning + hook slimming (DONE 2026-07-05)

**Assumptions:** nested `static/CLAUDE.md` + `mobile/CLAUDE.md` remain the path-scoped load mechanism (native, reliable); `.claude/rules/*.md` files are loaded by reference (pointers from CLAUDE.md and nested files), not assumed auto-loaded.

**Changes:**
- Root CLAUDE.md rewritten: 8,552 B (~2,140 tok) → **2,288 B (~570 tok)**. Now: stack one-liner, start-here protocol (STATE/effort-tier/activity-log/DECISIONS), Iron Rules in pointer form, key paths, verify commands, compaction directive.
- Displaced content (nothing lost): pipeline section → `.claude/agents/docs/PIPELINE.md`; role quick-starts → `.claude/agents/docs/role-quickstart.md` (Phase 3 folds into agent files); design-token block → `.claude/rules/design-tokens.md`; editing discipline → `.claude/rules/editing.md`; SPA/mobile orientation deleted — verified covered by `spa-navigation` skill + nested CLAUDE.md files. Backend orientation: covered by `docs/BACKEND_ARCHITECTURE.md:34-95` + `knowledge/be.md`; P4 review found `backend-patterns` skill itself is STALE (missing `_get_db`/BE-006/rate-limit, wrong SQLite snippet) → fix queued for Phase 2.
- `session_knowledge_inject.sh`: full INDEX (12,071 B) → org-wide table only + domain pointers + last 3 activity lines + STATE.md head-20 → **4,406 B (~1,300 tok)**.

**Before/after auto-load per session:** ~5,900 tokens → **~2,600 tokens** (CLAUDE.md ~570 + hook ~1,300 + MEMORY.md ~740). Remaining chunk is the Hebrew OW table (12 org-wide rules — highest-value content, kept deliberately). Forward references created intentionally: `.claude/rules/{effort,memory,reporting}.md`, `scripts/verify.sh` — land in Phases 5–8; tracked in STATE.md.

### Deletion log (P1 — nothing deleted without an entry here)
| Date | What | Why | Where preserved |
|---|---|---|---|
| — | (none yet) | | |
