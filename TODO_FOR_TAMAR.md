# TODO for Tamar — founder decisions & dependencies log

> Lightweight running log of (a) product decisions an agent couldn't make alone,
> (b) human-only blockers (accounts, API keys, payments), and (c) dependencies added.
> Urgent, progress-blocking items also go in `NEEDS_YOU.md` at the repo root.

---

## Open — founder decisions
- **Creator-credits: confirm $25 withdrawal minimum** (or set your preferred floor). v1 ships with $25; it's a one-constant change. See `docs/CREATOR_ECONOMICS.md` §5. — added 2026-06-26
- **Creator-credits: confirm ≥ 8% minimum affiliate rate** for inventory shown in the shoppable feed. This guarantees AWEAR stays net-positive on every credited order (the creator's 5% can't exceed our commission). See `docs/CREATOR_ECONOMICS.md` §3. — added 2026-06-26

## Open — human-only blockers
- The autonomous agent session is **write-gated on the `.claude/` tree** — it can't write `activity_log.md` or `contributions/*.md` (two agents this run, dolce + the orchestrator, both hit the permission wall). The run's log entries are preserved in the commit message + DAILY_DIGEST.md, but if you want the in-repo logs kept current, either (a) loosen the agent's write permission for `.claude/agents/` in the autopilot settings, or (b) paste the entries noted in DAILY_DIGEST. Worth fixing once so it stops recurring every run.

## Dependencies added
(none this run — doc-only task)
