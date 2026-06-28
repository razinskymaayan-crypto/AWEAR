# TODO for Tamar — founder decisions & dependencies log

> Lightweight running log of (a) product decisions an agent couldn't make alone,
> (b) human-only blockers (accounts, API keys, payments), and (c) dependencies added.
> Urgent, progress-blocking items also go in `NEEDS_YOU.md` at the repo root.

---

## Open — founder decisions
- **Creator-credits: confirm $25 withdrawal minimum** (or set your preferred floor). v1 ships with $25; it's a one-constant change. See `docs/CREATOR_ECONOMICS.md` §5. — added 2026-06-26
- **Creator-credits: confirm ≥ 8% minimum affiliate rate** for inventory shown in the shoppable feed. This guarantees AWEAR stays net-positive on every credited order (the creator's 5% can't exceed our commission). See `docs/CREATOR_ECONOMICS.md` §3. — added 2026-06-26

## Open — human-only blockers
- **Confirm the real clothing scan runs LIVE on the deploy box (1 command).** The autopilot CI runner has NO `ANTHROPIC_API_KEY` / `.env` / `venv312`, so I cannot run the live Claude-Vision scan from here — only diagnose its code (which I did: the SDK call, model id, and schema are all correct; nothing in the code forces demo mode). On the machine that has the key, run:
  `venv312/bin/python scripts/scan_smoke.py`
  Expected: `RESULT: LIVE  (demo_reason=None)` plus detected brand/color/material + buy_options. If you instead see `DEMO  (demo_reason=...)`, the reason tells you exactly why: `no_api_key` = the key isn't loaded into the server's env (check `.env` / GitHub secret injection); `api_error:auth` = key invalid/expired; `api_error:rate_limit` / `:timeout` = transient (retry); `api_error:parse` = model returned unparseable output. You can also hit `GET /api/scan-health` any time to see `{key_configured, model, last_analyze_mode, last_demo_reason}` without exposing the key. — added 2026-06-28
- The autonomous agent session is **write-gated on the `.claude/` tree** — it can't write `activity_log.md` or `contributions/*.md` (two agents this run, dolce + the orchestrator, both hit the permission wall). The run's log entries are preserved in the commit message + DAILY_DIGEST.md, but if you want the in-repo logs kept current, either (a) loosen the agent's write permission for `.claude/agents/` in the autopilot settings, or (b) paste the entries noted in DAILY_DIGEST. Worth fixing once so it stops recurring every run.

## Dependencies added
(none this run — doc-only task)
