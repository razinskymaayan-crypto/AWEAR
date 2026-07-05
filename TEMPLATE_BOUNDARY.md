# TEMPLATE_BOUNDARY — company-specific content log

> Purpose: when the generic skeleton is extracted for the next project, everything listed here is AWEAR-specific and must be **excluded or replaced by a placeholder**. Everything NOT listed here is infrastructure and travels with the template.
> Rule from the master prompt: company content is never modified by the overhaul — only separated and preserved exactly.

## Company-specific — EXCLUDE from template

### Strategy & business (highest sensitivity)
- `.claude/master/MASTER_PLAN.md` — locked founder decisions, timeline, budget, demo framing
- `.claude/master/strategy/` — all riddle docs (payments, distribution, catalog/supply, geo-routing) + INDEX
- `.claude/master/GUIDANCE.md` — founder-approved product direction
- `.claude/master/FOUNDER_QUESTIONS.md`, `INBOX.md`, `IDEAS.md`, `TODO_FOR_TAMAR.md` — content is company; the *pattern* (daily steering loop) is template
- `docs/BUSINESS_PLAN.md`, `PITCH_DECK.md`, `PRODUCT_VISION.md`, `CREATOR_ECONOMICS.md`, `DEMO_SCRIPT.md`, `UX_RESEARCH.md`, `docs/surveys/`, `docs/research/`
- Root `IDEAS.md`, `NEEDS_YOU.md`, `DAILY_DIGEST.md`

### Product & brand
- `awear-tokens.json` + `static/tokens.css` + `mobile/theme/tokens.js` — Mediterranean Modern palette/type values (the SoT *chain* is template; the *values* are brand)
- `docs/VISUAL_VISION.md` — design language (structure = template pattern, content = brand)
- `docs/SURFACE_SPECS.md` — screen specs
- `static/data/` — posts/products/profiles seed catalog
- `static/img/` — demo imagery
- `static/i18n/` — copy strings
- Loop-stage vocabulary (SCAN/MATCH/LOOKS/BUY/EARN) wherever it appears

### App code (product itself, not skeleton)
- `app.py`, `schema.sql`, `static/index.html`, `mobile/` — the product; template takes the *patterns* (BE-006, endpoint template, token chain), not the code

### Org & personas
- `.claude/agents/*.md` persona identities (Jeff/Steve/Gabbana/… names, Hebrew personas, role assignments) — the ~30-line agent *format* is template; names and org chart are company
- `.claude/agents/docs/org.md`, `COMPANY_OPERATING_MANUAL.md`, `jeff.md`, `daily_model.md` (company process specifics)
- `.claude/agents/plans/`, `logs/`, `contributions/` — historical company work products

### Knowledge content
- Learning-code *entries* cite AWEAR incidents (price_estimate_ils, .fca-ico, etc.) — the code-registry *system* (INDEX + domain files + enforcement column) is template; entry contents are company
- `knowledge/LEARNING_LOG.md`, `.claude/agents/knowledge/*` content
- Memory dir `project_*` files (vision, strategy teams, telegram bridge status)

### Ops identity
- `.env`, Google creds, `tg_whoami.json`, Telegram chat ids in workflows/scripts
- `data/awear.db`

## Infrastructure — TRAVELS with template (for the extraction guide)
- CLAUDE.md *structure* (post-Phase-1), `.claude/rules/`, hooks + `scripts/hook_*.py`, `scripts/guard_checks.sh` pattern, `scripts/tglib.py` (genericize chat id)
- Skills: all SKILL.md machinery (triggers/frontmatter patterns); skill-gardener; verify-rendering; worktree-discipline; stall-escalation; wire-it-up (AWEAR examples inside get placeholder-ized at extraction)
- Workflow *shapes*: engine + lanes + adversarial merge gate + retrospective + steering loop
- STATE.md / DECISIONS.md / NEEDS_DECISION.md / AUDIT_REPORT.md / notes/ conventions
- Learning-code registry system, activity-log format, effort tiers, reporting protocol, evals harness (Phases 5–8)
