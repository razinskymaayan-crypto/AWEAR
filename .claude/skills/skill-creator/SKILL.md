---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance for the AWEAR agent system. Use when building a skill from scratch, editing or optimizing an existing one, running evals to test a skill, benchmarking with variance analysis, or optimizing a skill's description for better triggering accuracy. Make sure to use this skill whenever the user mentions creating a skill, improving a skill, testing a skill, writing SKILL.md, or evaluating how well a skill triggers.
---

# Skill Creator — AWEAR

A skill for creating new skills and iteratively improving them within the AWEAR agent system.

## AWEAR Context — Read Before Starting

**Skills location:** `.claude/skills/<name>/SKILL.md` in the AWEAR repo.

**Existing skills to not contradict** (always check new skills against these):
- `verify-rendering` — Playwright check before any render merge
- `js-tzdead-zone` — const/let TDZ, define before first use
- `container-css-check` — check overflow/position before adding elements to containers
- `wire-it-up` — file exists ≠ feature connected; verify real usage
- `worktree-discipline` — Iron Rule #14, always in assigned worktree
- `backend-rename-safety` — grep all callers before renaming backend fields
- `stall-escalation` — stop and report when blocked, don't work around
- `frontend-design` — use AWEAR design tokens, not free creative direction
- `code-reviewer` — layer-specific review checklist for py/js/rn

**Infrastructure paths** (all relative to this skill's directory):
```
.claude/skills/skill-creator/
├── SKILL.md
├── eval-viewer/generate_review.py    ← HTML review generator
├── scripts/aggregate_benchmark.py   ← benchmark aggregation
├── scripts/run_loop.py              ← description optimization
├── scripts/package_skill.py        ← .skill packaging
├── agents/grader.md                ← grading subagent instructions
├── agents/comparator.md            ← blind A/B comparison instructions
├── agents/analyzer.md              ← benchmark analysis instructions
├── references/schemas.md           ← JSON schemas
└── assets/eval_review.html         ← trigger eval review HTML template
```

When running scripts, use full paths:
```bash
SKILL_CREATOR=".claude/skills/skill-creator"
python $SKILL_CREATOR/scripts/aggregate_benchmark.py ...
```

**Python environment:** `source venv312/bin/activate` first.

**Approval flow:** Jeff creates/adapts skills → Carmel reviews → merged to main.

---

## The Core Loop

```
understand intent → draft skill → test → evaluate → improve → repeat
```

Your job is to figure out where the user is in this process and jump in. Maybe they want a skill from scratch. Maybe they already have a draft. Maybe they want to improve an existing one. Be flexible.

---

## Step 1 — Capture Intent

If the current conversation already shows a workflow the user wants to capture (tools used, sequence of steps, corrections made), extract answers from history first.

Understand:
1. What should this skill enable Claude to do?
2. When should it trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Does it need test cases? (objectively verifiable outputs = yes; subjective outputs = maybe not)

**Check for contradictions before writing anything.** Read the existing skills listed above and ask: does my proposed skill's approach conflict with any of them? If yes, flag it to the user before proceeding.

---

## Step 2 — Write the SKILL.md

Components:

- **name**: Skill identifier (matches directory name)
- **description**: Primary triggering mechanism. Include both what the skill does AND when to use it. Make it slightly "pushy" — Claude tends to undertrigger. Example: instead of "Tool for X", write "Tool for X. Use this whenever the user mentions X, Y, or Z, even if they don't explicitly ask for it."
- **The body**: Instructions, examples, reference pointers

**Anatomy of a skill:**
```
.claude/skills/<name>/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled resources (optional)
    ├── scripts/   — executable code for deterministic tasks
    ├── references/ — docs loaded as needed
    └── assets/    — templates, icons, fonts
```

**Progressive disclosure:**
1. Metadata (name + description) — always in context
2. SKILL.md body — in context when skill triggers (keep under 500 lines)
3. Bundled resources — loaded as needed

For large reference files (>300 lines), include a table of contents at the top.

**Writing style:** Explain WHY behind instructions, not just WHAT. Today's LLMs are smart — when they understand the reasoning they can generalize beyond the literal instructions. Avoid ALL CAPS MUST statements where possible; prefer "here's why this matters." Write a draft, then read it with fresh eyes and improve.

---

## Step 3 — Test Cases

Come up with 2-3 realistic test prompts — the kind a real user would actually say. Share them with the user for confirmation before running.

Save to `evals/evals.json` (under the skill's workspace, not the project root):
```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema.

---

## Step 4 — Run and Evaluate

This is one continuous sequence. Don't stop partway through.

### Spawn runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents simultaneously — one with the skill, one without. Save to `<skill-name>-workspace/iteration-<N>/eval-<ID>/`.

**With-skill run prompt:**
```
Execute this task:
- Skill path: .claude/skills/<name>/SKILL.md
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
```

**Baseline run:** Same prompt, no skill, save to `without_skill/outputs/`.

Create `eval_metadata.json` for each:
```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-of-what-this-tests",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### While runs are in progress — draft assertions

Don't wait. Good assertions are objectively verifiable and have descriptive names. Subjective skills (writing style, design) don't need forced assertions — use human judgment. Update `eval_metadata.json` with assertions once drafted.

### When runs complete — capture timing

Each subagent notification contains `total_tokens` and `duration_ms`. Save immediately to `timing.json` in the run directory — this is the only chance to capture it:
```json
{"total_tokens": 84852, "duration_ms": 23332, "total_duration_seconds": 23.3}
```

### Grade, aggregate, and launch viewer

1. **Grade** — spawn grader subagent (read `agents/grader.md`). Save `grading.json` per run.

2. **Aggregate:**
```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/aggregate_benchmark.py \
  <workspace>/iteration-N --skill-name <name>
```

3. **Analyze** — read `agents/analyzer.md`. Look for non-discriminating assertions (always pass regardless of skill), high-variance evals (possibly flaky), time/token tradeoffs.

4. **Launch viewer:**
```bash
source venv312/bin/activate
python .claude/skills/skill-creator/eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "<name>" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  --static /tmp/<name>-review.html
open /tmp/<name>-review.html
```
For iteration 2+, add: `--previous-workspace <workspace>/iteration-<N-1>`

5. Tell the user: "I've opened the results. 'Outputs' tab = click through test cases and leave feedback. 'Benchmark' tab = quantitative comparison. Come back when done."

**Important:** Generate the viewer BEFORE evaluating inputs yourself. Get human eyes on the outputs first.

### Read feedback

When the user is done, read `feedback.json` from the workspace. Empty feedback = fine. Focus improvements on cases with specific complaints.

---

## Step 5 — Improve and Repeat

1. Generalize from feedback — don't overfit to the specific test cases
2. Keep SKILL.md lean — remove things that aren't pulling their weight
3. Explain the why — LLMs follow intent better than rigid rules
4. Look for repeated work across test cases — if all 3 runs wrote the same helper script, bundle it in `scripts/`
5. Apply improvements, rerun (increment iteration number), repeat

Stop when: user says happy, feedback is all empty, or no meaningful progress.

---

## Advanced: Blind Comparison

For rigorous comparison between two skill versions. Read `agents/comparator.md` and `agents/analyzer.md`. Give two outputs to an independent agent without labeling which is which. Analyze why the winner won. Optional — human review is usually sufficient.

---

## Description Optimization

After creating or improving, offer to optimize the description for better triggering.

### Generate trigger eval queries

Create 20 queries — mix of should-trigger and should-not-trigger. Save as JSON:
```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

Make queries realistic and specific. Bad: `"Format this data"`. Good: `"ok so my boss sent me this xlsx called Q4 sales final FINAL v2.xlsx and she wants me to add a profit margin column — revenue in col C, costs in col D"`.

For should-not-trigger: use near-misses — queries sharing keywords but needing something different. Don't make them obviously irrelevant.

### Review with user

1. Read `assets/eval_review.html`
2. Replace `__EVAL_DATA_PLACEHOLDER__`, `__SKILL_NAME_PLACEHOLDER__`, `__SKILL_DESCRIPTION_PLACEHOLDER__`
3. Write to `/tmp/eval_review_<skill-name>.html` and `open` it
4. User edits queries, toggles should-trigger, clicks "Export Eval Set"
5. File downloads as `~/Downloads/eval_set.json`

### Run the optimization loop

```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/run_loop.py \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path .claude/skills/<name>/SKILL.md \
  --model claude-sonnet-4-6 \
  --max-iterations 5 \
  --verbose
```

The loop: splits eval set 60/40 train/test, evaluates current description (3 runs per query for reliability), asks Claude to propose improvements on failures, re-evaluates, iterates. Returns `best_description` chosen by test score (not train) to avoid overfitting.

### Apply the result

Update the skill's frontmatter `description` field with `best_description`. Show before/after and report scores.

---

## Package

```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/<name>
```

Outputs `<name>.skill` in the current directory.
