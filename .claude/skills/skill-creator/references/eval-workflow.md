# Eval Workflow — Detailed Reference

Full instructions for running evals, grading, aggregating, and reviewing results.
Loaded when you reach Step 4 (Run and Evaluate) in the skill-creation loop.

---

## Spawn Runs — With-Skill AND Baseline in the Same Turn

For each test case, spawn two subagents simultaneously. Save to `<skill-name>-workspace/iteration-<N>/eval-<ID>/`.

**With-skill run prompt:**
```
Execute this task:
- Skill path: .claude/skills/<name>/SKILL.md
- Task: <eval prompt>
- Input files: <eval files, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
```

**Baseline:** Same prompt, no skill, save to `without_skill/outputs/`.

Create `eval_metadata.json` for each eval directory:
```json
{
  "eval_id": 1,
  "eval_name": "descriptive-slug",
  "prompt": "The exact prompt used",
  "assertions": []
}
```

---

## While Runs Are In Progress — Draft Assertions

Don't wait. Good assertions are objectively verifiable. Update `eval_metadata.json` with assertions as you draft them.

```json
"assertions": [
  {"id": "a1", "text": "Output uses var(--token-name) for all colors", "type": "absence"},
  {"id": "a2", "text": "New screen registered in showView()", "type": "exists"}
]
```

Types: `"exists"`, `"absence"`, `"value"`, `"subjective"`.

---

## Capture Timing — Do This Immediately When Runs Complete

Each subagent notification contains `total_tokens` and `duration_ms`. Save immediately — this is the only chance:

```json
{"total_tokens": 84852, "duration_ms": 23332, "total_duration_seconds": 23.3}
```

Save to `<workspace>/iteration-N/eval-<ID>/with_skill/timing.json` (and `without_skill/timing.json`).

---

## Grade → Aggregate → Analyze → Viewer

**1. Grade** — spawn grader subagent (read `agents/grader.md`):
```
Grading task:
- Eval metadata: <paste eval_metadata.json>
- Outputs dir: <workspace>/iteration-N/eval-<ID>/with_skill/outputs/
- Save grading.json to: <workspace>/iteration-N/eval-<ID>/with_skill/grading.json
- Read agents/grader.md for instructions
```

**2. Aggregate:**
```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/aggregate_benchmark.py \
  <workspace>/iteration-N --skill-name <name>
```

**3. Analyze** — read `agents/analyzer.md`. Look for: non-discriminating assertions (always pass), high-variance evals (flaky), time/token tradeoffs.

**4. Launch viewer:**
```bash
source venv312/bin/activate
python .claude/skills/skill-creator/eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "<name>" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  --static /tmp/<name>-review.html
open /tmp/<name>-review.html
```
For iteration 2+: add `--previous-workspace <workspace>/iteration-<N-1>`

Tell the user: "Outputs tab = click through and leave feedback. Benchmark tab = quantitative summary. Come back when done."

**Important:** Open the viewer BEFORE evaluating outputs yourself. Get human eyes first.

---

## Read Feedback and Improve

When the user is done, read `feedback.json` from the workspace. Empty feedback = no issues. Focus improvements on cases with specific complaints.

Improvement principles:
1. Generalize from feedback — don't overfit to the exact test cases
2. Keep SKILL.md lean — remove lines that aren't pulling their weight
3. Explain WHY — LLMs follow intent better than rigid rules
4. Look for repeated work across runs — if all 3 runs wrote the same helper, bundle it in `scripts/`
5. Increment iteration number, repeat

Stop when: user says satisfied, feedback is all empty, or no meaningful progress between iterations.

---

## Advanced: Blind Comparison

For rigorous version comparison. Read `agents/comparator.md`. Give both outputs to an independent agent without labeling which is which. Analyze why the winner won.

---

## See Also

- `references/schemas.md` — JSON schemas for all files
- `agents/grader.md`, `agents/comparator.md`, `agents/analyzer.md` — subagent instructions
- `scripts/aggregate_benchmark.py` — benchmark aggregation script
- `eval-viewer/generate_review.py` — HTML review generator
