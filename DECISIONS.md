# DECISIONS — architectural choices (consult before re-researching)

> One line per decision + rationale. This file exists so sessions stop re-litigating settled
> questions — the single biggest token leak in long-running projects. Product/company locked
> decisions (platform, market, pricing) live in `.claude/master/MASTER_PLAN.md` חלק ג׳ — this
> file is for **infrastructure & architecture**. Who may write here: `.claude/rules/memory.md`.

| # | Decision | Rationale | Source |
|---|---|---|---|
| 1 | Runtime DB = SQLite via `init_db()` in app.py; `schema.sql` is aspirational PostgreSQL, NOT the live schema | One file, zero ops for demo stage; real schema lives where it runs | BE-004/BE-005; verified app.py:1045 |
| 2 | Web-first; `mobile/` stays dormant; iOS ships as Capacitor wrap of the SPA | Founder-locked 19.06 (MASTER_PLAN #1) | MASTER_PLAN ג׳#1 |
| 3 | Design-token SoT chain: `awear-tokens.json` is the source; `static/tokens.css` is hand-kept in sync (NO generator script exists yet); `mobile/theme/tokens.js` imports the json directly. Token change = edit json AND css together | Single conceptual source; automation of css generation is an open improvement | .claude/rules/design-tokens.md |
| 4 | Only path to main for autonomous CODE lanes (auto/*) = `jeff-merge.yml` (build + guard_checks + adversarial persona review). Note: retrospective/telegram-poll/whoami push docs/state files directly to main — the gate governs code | One gate, adversarial by design | .github/workflows/jeff-merge.yml |
| 5 | Telegram I/O only via `scripts/tglib.py` (chunking/retries/429); `tg.sh` is a thin wrapper; no raw curl | One battle-tested path; failures logged | project memory 2026-07-05 |
| 6 | `static/index.html` stays single-file until a dedicated modularization project with the eval harness as safety net | TDZ/load-order risk >> aesthetic gain today | NEEDS_DECISION #5 (default applied) |
| 7 | Internal currency = USD; FX = static table in v1 (live API needs Jeff/board approval) | Founder-locked 18.06 | MASTER_PLAN ג׳#7-8 |
| 8 | Learnings architecture = the learning-code registry (`knowledge/INDEX.md` + domain files); NO parallel LEARNINGS.md hierarchy | One system, already incident-driven and CI-sync-gated | foundation Phase 5 |
| 9 | Rules enforceable by code live in hooks/guard_checks, not prose; prose keeps pointer-form only | OW-006: unenforced rule = recommendation | foundation Phase 4 |
| 10 | Agent model routing: implementers `model: sonnet`; judgment/gate/strategy agents inherit the session's strongest model | Cost scales with volume of implementation work, judgment stays sharp | foundation Phase 3 |
| 11 | Parallel work on shared files = worktrees under `AWEAR/worktrees/` + separate anchors, serial merge | OW-010 incident-derived | knowledge/OW.md |
| 12 | ~~Lanes stay PAUSED~~ REVERSED 2026-07-05 (remote session): lanes RESUMED on the 3-disjoint-lane architecture, 6h cadence — cadence IS the budget cap | Quota burn root-caused (lane overlap, not cadence alone); fix `d321558` | autopilot-managers.yml |
| 13 | `data/awear.db`: schema is created idempotently at startup (`init_db()`); demo content seeds from `static/data/*.json`; **user-persisted rows (likes/follows/saves/users) live ONLY in the db file — deleting it loses them**. Untrack-from-git intent per NEEDS_DECISION #2 | BE-005: SQLite is THE store for user data; the .gitignore "regenerated" comment is about schema, not data | app.py:1045; NEEDS_DECISION #2 |
| 14 | Skills carry judgment/orientation; fully deterministic checks are scripts/hooks, never skills | Determinism belongs to the harness | foundation Phase 2 |
| 15 | Session auto-load budget ≈ 2.6k tokens: CLAUDE.md ≤ ~600, knowledge hook injects org-wide table + pointers only (never the full INDEX) | Context is for decisions, not orientation dumps | foundation Phase 1 |
| 16 | Jeff STAYS as the merge gate (question "remove jeff-merge?" settled NO 2026-07-06); hardened with deterministic layers instead: ownership GATE 0, failure circuit-breaker, conflict TTL, main-canary, union-merge logs | jeff-merge was 7/7 green — failures were upstream (lane overlap); gate is the only barrier between autonomous agents and main | jeff-merge.yml, autopilot-managers.yml, main-canary.yml, .gitattributes |
| 17 | **Production architecture (launch, founder 2026-07-18):** FastAPI hosted on **Render**; **Supabase** for **Postgres** (migrate from SQLite via the single `_get_db()` chokepoint, app.py:1282), **Auth** (real register/login), **Storage** (product + AI-generated images). Capacitor `server.url` → the public Render HTTPS URL (SPA already calls `/api` relatively → one config line). **Amends #1** — SQLite is interim only until the Postgres migration lands. Founder chose long-term-correct over the fast SQLite-only path | Real launch + scale foundation; Supabase can't run Python so FastAPI still needs a host | founder direction 2026-07-18 |

## How to add a decision
One row, one line of rationale, cite the source (incident, founder call, phase). If it reverses an existing row — edit that row, note the date, don't append a contradiction.
