# DECISIONS — architectural choices (consult before re-researching)

> One line per decision + rationale. This file exists so sessions stop re-litigating settled
> questions — the single biggest token leak in long-running projects. Product/company locked
> decisions (platform, market, pricing) live in `.claude/master/MASTER_PLAN.md` חלק ג׳ — this
> file is for **infrastructure & architecture**. Who may write here: `.claude/rules/memory.md`.

| # | Decision | Rationale | Source |
|---|---|---|---|
| 1 | Runtime DB = SQLite via `init_db()` in app.py; `schema.sql` is aspirational PostgreSQL, NOT the live schema | One file, zero ops for demo stage; real schema lives where it runs | BE-004/BE-005; verified app.py:1045 |
| 2 | Web-first; `mobile/` stays dormant; iOS ships as Capacitor wrap of the SPA | Founder-locked 19.06 (MASTER_PLAN #1) | MASTER_PLAN ג׳#1 |
| 3 | Design-token SoT chain: `awear-tokens.json` → generates `static/tokens.css` → feeds `mobile/theme/tokens.js`; edit the json only | Single source; css/js are artifacts | .claude/rules/design-tokens.md |
| 4 | Only path to main for autonomous lanes = `jeff-merge.yml` (build + guard_checks + adversarial persona review) | One gate, adversarial by design | .github/workflows/jeff-merge.yml |
| 5 | Telegram I/O only via `scripts/tglib.py` (chunking/retries/429); `tg.sh` is a thin wrapper; no raw curl | One battle-tested path; failures logged | project memory 2026-07-05 |
| 6 | `static/index.html` stays single-file until a dedicated modularization project with the eval harness as safety net | TDZ/load-order risk >> aesthetic gain today | NEEDS_DECISION #5 (default applied) |
| 7 | Internal currency = USD; FX = static table in v1 (live API needs Jeff/board approval) | Founder-locked 18.06 | MASTER_PLAN ג׳#7-8 |
| 8 | Learnings architecture = the learning-code registry (`knowledge/INDEX.md` + domain files); NO parallel LEARNINGS.md hierarchy | One system, already incident-driven and CI-sync-gated | foundation Phase 5 |
| 9 | Rules enforceable by code live in hooks/guard_checks, not prose; prose keeps pointer-form only | OW-006: unenforced rule = recommendation | foundation Phase 4 |
| 10 | Agent model routing: implementers `model: sonnet`; judgment/gate/strategy agents inherit the session's strongest model | Cost scales with volume of implementation work, judgment stays sharp | foundation Phase 3 |
| 11 | Parallel work on shared files = worktrees under `AWEAR/worktrees/` + separate anchors, serial merge | OW-010 incident-derived | knowledge/OW.md |
| 12 | Autonomous lanes stay PAUSED (`.agents_paused`) until founders pick a resume cadence | Quota burn 2026-07-05; cadence table prepared | NEEDS_DECISION #4 |
| 13 | `data/awear.db` is regenerated at startup, never source of truth; seed truth = `static/data/*.json` + `init_db()` | Reproducible demos; no binary-in-git drift | .gitignore comment; NEEDS_DECISION #2 |
| 14 | Skills carry judgment/orientation; fully deterministic checks are scripts/hooks, never skills | Determinism belongs to the harness | foundation Phase 2 |
| 15 | Session auto-load budget ≈ 2.6k tokens: CLAUDE.md ≤ ~600, knowledge hook injects org-wide table + pointers only (never the full INDEX) | Context is for decisions, not orientation dumps | foundation Phase 1 |

## How to add a decision
One row, one line of rationale, cite the source (incident, founder call, phase). If it reverses an existing row — edit that row, note the date, don't append a contradiction.
