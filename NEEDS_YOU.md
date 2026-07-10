# ⚠️ NEEDS YOU — things only the founder can do

> Whenever an agent is blocked on something that needs Carmel before progress can
> continue (an account, a payment, an API key, a decision), it adds a line here.
> This file sits at the top of the repo so it's the first thing you see on GitHub.
>
> Check it from your phone. Do the item, then delete its line (or mark it ✅).

---

## Open — needs your attention
- 2026-07-05 — **Agents can no longer write under `.claude/`** (permission-blocked for Write/Edit/Bash alike, tested by gabbana this run). This breaks the org's own protocol: activity_log.md rows, contributions ledger, and assignments/<agent>.md queues can't be updated by agents. Likely a side effect of the 2026-07-05 "mechanism hardening" (PreToolUse guards / CI permission config). Either re-allow `.claude/agents/**` writes for agents, or move the log/ledger/assignments out of `.claude/`. Until then agents will drop coordination files into `docs/` as a workaround (this run: `docs/design_reviews/2026-07-05-stories-TASKS-for-mark.md`). **Re-confirmed still blocked 2026-07-10 (steve run)** — two runs' worth of check-offs/activity-log/contributions rows are now queued in `notes/p1-bcrypt-passwords.md` + `notes/p2-comments-notifications-sqlite.md`.
- 2026-06-29 — **GitHub Actions stopped (all agents halted).** No workflow has run since my last push — likely the free **2,000 Actions-minutes/month ran out** (the faster cadence I set burned them; my mistake, now reverted to the sustainable baseline). Free tier fundamentally can't run agents 24/7. **THE unblocker = the cloud VM** (self-hosted runner = unlimited minutes). To restart NOW before the VM: GitHub → Settings → Billing → raise the Actions spending limit, OR give me a GitHub **token** so I can check/fix billing + dispatch. Until one of these, nothing autonomous runs.
- 2026-06-29 — **Always-on parallel agent org** (approved plan `.claude/plans/1-wiggly-seal.md`). To turn it on, 3 things only you/Razi can provide:
  1. **Two valid Anthropic API keys** — the current one in `.env` is **invalid (401)**. Need a working key from Carmel's account AND Razi's account (these pool the daily token budget). 
  2. **A small always-on cloud VM** (Hetzner/DigitalOcean/Lightsail ~$5–12/mo) to host the runner 24/7 — create it (or approve me scripting it) + share SSH.
  3. **Telegram for 2-way control** (already coded in `telegram_bot.py`): send me your + Razi's Telegram **user IDs** (DM @userinfobot → it replies your numeric id) so I set `TG_ALLOWED_IDS`. Then the bot accepts `/task`, `/status`, `/pause`, `@dolce <task>`, etc., from just the two of you.
- 2026-06-27 — Closet Analytics survey scored **Trust/credibility 3/10 (SEVERE)**: the screen was showing contradictory/placeholder stats (100% utilization next to 18% never-worn, a fake "Satin Skirt · worn 1 time"). **Auto-fixed this run** — numbers now derive from one source of truth (verified). No action needed unless you want to review; bigger follow-ups are in IDEAS.md.
- 2026-06-27 — Closet **Statistics** survey (re-run on current screen) again scored **Trust 3/10 (SEVERE)** — different root cause: the demo closet was "too perfect" (every item worn → 98/A Health, 100% utilization, nothing to sell). **Auto-fixed this run** — reseeded 3 never-worn items so the closet reads 75/Grade-B with a real ~$300 Dead Zone; Hidden Cost now stays a worn item; Style Identity card warmed to brand. Gabbana-gated 8/10, verified. No action needed; remaining ideas (Hidden Cost "List" CTA, tappable insights, naming) are in IDEAS.md.

---

## Done
