# ⚠️ NEEDS YOU — things only the founder can do

> Whenever an agent is blocked on something that needs Carmel before progress can
> continue (an account, a payment, an API key, a decision), it adds a line here.
> This file sits at the top of the repo so it's the first thing you see on GitHub.
>
> Check it from your phone. Do the item, then delete its line (or mark it ✅).

---

## Open — needs your attention
- 2026-06-29 — **Always-on parallel agent org** (approved plan `.claude/plans/1-wiggly-seal.md`). To turn it on, 3 things only you/Razi can provide:
  1. **Two valid Anthropic API keys** — the current one in `.env` is **invalid (401)**. Need a working key from Carmel's account AND Razi's account (these pool the daily token budget). 
  2. **A small always-on cloud VM** (Hetzner/DigitalOcean/Lightsail ~$5–12/mo) to host the runner 24/7 — create it (or approve me scripting it) + share SSH.
  3. **Telegram for 2-way control** (already coded in `telegram_bot.py`): send me your + Razi's Telegram **user IDs** (DM @userinfobot → it replies your numeric id) so I set `TG_ALLOWED_IDS`. Then the bot accepts `/task`, `/status`, `/pause`, `@dolce <task>`, etc., from just the two of you.
- 2026-06-27 — Closet Analytics survey scored **Trust/credibility 3/10 (SEVERE)**: the screen was showing contradictory/placeholder stats (100% utilization next to 18% never-worn, a fake "Satin Skirt · worn 1 time"). **Auto-fixed this run** — numbers now derive from one source of truth (verified). No action needed unless you want to review; bigger follow-ups are in IDEAS.md.
- 2026-06-27 — Closet **Statistics** survey (re-run on current screen) again scored **Trust 3/10 (SEVERE)** — different root cause: the demo closet was "too perfect" (every item worn → 98/A Health, 100% utilization, nothing to sell). **Auto-fixed this run** — reseeded 3 never-worn items so the closet reads 75/Grade-B with a real ~$300 Dead Zone; Hidden Cost now stays a worn item; Style Identity card warmed to brand. Gabbana-gated 8/10, verified. No action needed; remaining ideas (Hidden Cost "List" CTA, tappable insights, naming) are in IDEAS.md.

---

## Done
