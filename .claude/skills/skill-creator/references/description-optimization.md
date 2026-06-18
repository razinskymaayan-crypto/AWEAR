# Description Optimization — Reference

How to optimize a skill's `description:` field for better triggering accuracy using `run_loop.py`.

---

## Generate Trigger Eval Queries

Create 20 queries — 12 should-trigger, 8 should-not-trigger. Save as JSON:

```json
[
  {"query": "I need to add a hover state to the product card", "should_trigger": true},
  {"query": "check the backend for SQL injection", "should_trigger": false}
]
```

**Good queries:** realistic user phrasing, specific to actual use cases.  
**Should-not-trigger:** near-misses — same topic, different intent. Not obviously irrelevant.  
**Bad:** `"Format this data"` — too generic. Good: `"my boss sent Q4 sales FINAL v2.xlsx, add profit margin column"`

---

## Review Queries With User

1. Read `assets/eval_review.html`
2. Replace these three placeholders:
   - `__EVAL_DATA_PLACEHOLDER__` → JSON array of `{query, should_trigger}` objects
   - `__SKILL_NAME_PLACEHOLDER__` → skill name string
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → current description text
3. Write to `/tmp/eval_review_<skill-name>.html` and run `open /tmp/eval_review_<skill-name>.html`
4. User edits queries, toggles should-trigger, clicks "Export Eval Set"
5. File downloads as `eval_set_<skill-name>.json` in `~/Downloads/`

---

## Run the Optimization Loop

```bash
source venv312/bin/activate
python .claude/skills/skill-creator/scripts/run_loop.py \
  --eval-set ~/Downloads/eval_set_<skill-name>.json \
  --skill-path .claude/skills/<name>/SKILL.md \
  --model claude-sonnet-4-6 \
  --max-iterations 5 \
  --verbose \
  --output /tmp/<name>-loop-results.json
```

The loop:
- Splits 60% train / 40% test (to avoid overfitting to training queries)
- Evaluates current description (3 runs per query for reliability via majority vote)
- On failures: asks Claude to propose an improved description
- Re-evaluates the proposal
- Repeats up to `--max-iterations` times
- Returns `best_description` chosen by **test score** (not train)

---

## Apply the Result

Read `/tmp/<name>-loop-results.json`. The `best_description` field is the winner.

Update the skill's `description:` frontmatter field. Show the user before/after and the test score improvement. Do not apply if the improvement is <3pp — noise.

---

## When to Use This

Offer description optimization after any of:
- Initial skill creation
- A major SKILL.md rewrite
- User reports the skill is triggering on wrong things or not triggering when it should

It's optional — human review of the eval queries is the most valuable part, even if you skip the loop.
