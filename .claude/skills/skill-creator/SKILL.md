---
name: skill-creator
description: "Create new skills, improve existing ones, and measure skill performance for the AWEAR agent system. Use when building a skill from scratch, editing or optimizing an existing one, writing a SKILL.md, running evals to test quality, or improving a skill's triggering description. Trigger whenever the user mentions creating, editing, testing, or evaluating a skill. Sibling: skill-gardener — creator builds and evals NEW skills; gardener maintains EXISTING ones from accumulated correction evidence (rejections, learning codes, rework)."
---

# Skill Creator — AWEAR

A skill for building and iteratively improving skills within the AWEAR agent system.

## AWEAR Context

**Skills location:** `.claude/skills/<name>/SKILL.md`

**Existing skills — check new skills against these before writing:**
| Skill | What it guards |
|-------|---------------|
| `spa-navigation` | SPA view map, render patterns, i18n, TDZ order |
| `backend-patterns` | Endpoint template, demo mode, Pydantic, SQLite |
| `verify-rendering` | Playwright render check (Iron Rule #9) |
| `js-tzdead-zone` | const/let TDZ — define before first use |
| `container-css-check` | overflow/position audit before adding elements |
| `wire-it-up` | file exists ≠ feature connected |
| `worktree-discipline` | Iron Rule #14, never write to main repo |
| `backend-rename-safety` | grep callers before renaming backend fields |
| `stall-escalation` | stop and report when blocked |
| `frontend-design` | AWEAR design tokens, Gabbana approval gate |
| `code-reviewer` | layer-specific review checklist (py/js/rn) |

**Approval flow:** Jeff creates/adapts → Carmel reviews → merged to main.

**Python env:** `source venv312/bin/activate` before running any script.

---

## The Loop

```
capture intent → write SKILL.md → test cases → run evals → review → improve → repeat
```

Jump in wherever the user is. Don't restart from step 1 if they already have a draft.

---

## Step 1 — Capture Intent

If the conversation shows a workflow being captured (tools used, corrections, sequence of steps), extract intent from history first rather than asking.

Understand:
- What should this skill enable Claude to do?
- When should it trigger? (specific user phrases or contexts)
- Does it need measurable test cases? (objectively verifiable = yes; purely subjective = maybe not)

**Check for contradictions.** Read the existing skills table above. If your proposed approach conflicts with any of them, flag it before writing.

---

## Step 2 — Write SKILL.md

```
.claude/skills/<name>/
├── SKILL.md            ← required, under 200 lines ideally
└── (optional)
    ├── scripts/        ← deterministic helper code
    ├── references/     ← large docs loaded on demand
    └── assets/         ← templates, HTML tools
```

**Frontmatter (required):**
```yaml
---
name: skill-name
description: What it does AND when to trigger. Use "Use when/before/after..." phrasing. Slightly pushy — Claude tends to undertrigger.
---
```

**Body:** Explain WHY, not just WHAT. LLMs follow intent better than rigid rules. Keep under 200 lines — move large reference material to `references/` and load it on demand.

**Progressive disclosure:**
- Description only → always in context (used for triggering)
- SKILL.md body → loaded when skill triggers
- Files in `references/` → loaded only when explicitly read

---

## Step 3 — Test Cases

Propose 2–3 realistic test prompts. Share with the user for confirmation before running evals.

Save to `<skill-name>-workspace/evals.json`:
```json
{
  "skill_name": "example",
  "evals": [
    {"id": 1, "prompt": "...", "expected_output": "...", "files": []}
  ]
}
```

See `references/schemas.md` for the full schema.

---

## Step 4 — Run Evals and Improve

Read `references/eval-workflow.md` for the full sequence:
1. Spawn with-skill + baseline runs simultaneously
2. Draft assertions while runs are in progress
3. Capture timing immediately when runs complete
4. Grade → aggregate → analyze → open HTML viewer
5. Get user feedback → improve → increment iteration → repeat

Stop when: feedback is empty, user is satisfied, or no meaningful progress between iterations.

---

## Step 5 — Optimize Triggering (Optional)

After the skill is working well, offer to optimize the `description:` for better triggering accuracy.

Read `references/description-optimization.md` for the full process (trigger eval queries, HTML review tool, `run_loop.py`).

---

## Package

```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/<name>
# outputs <name>.skill in current directory
```
