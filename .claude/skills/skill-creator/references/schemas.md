# JSON Schemas — Skill Creator

Reference for all JSON files used by the skill-creator eval infrastructure.

---

## evals.json — Eval Test Cases

Stored in `<skill-name>-workspace/evals.json` (created before running evals).

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "The task prompt given to the agent verbatim",
      "expected_output": "Description of what a correct output looks like",
      "files": [
        {
          "path": "relative/path/to/input/file.py",
          "content": "file content as string (for small files)"
        }
      ]
    }
  ]
}
```

**Fields:**
- `id` — integer, unique within the eval set
- `prompt` — the exact user message given to the agent
- `expected_output` — human-readable description used to write assertions
- `files` — optional input files the agent should have access to

---

## eval_metadata.json — Per-Eval Metadata with Assertions

Written per eval directory `<workspace>/iteration-N/eval-<ID>/eval_metadata.json`.

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-slug-of-what-this-tests",
  "prompt": "The exact prompt used in this run",
  "assertions": [
    {
      "id": "a1",
      "text": "The output includes a working CSS class for hover state",
      "type": "exists"
    },
    {
      "id": "a2",
      "text": "No hardcoded color values — all values use var(--token-name)",
      "type": "absence"
    }
  ]
}
```

**Assertion types:**
- `"exists"` — the output contains or does something
- `"absence"` — the output does NOT contain or do something
- `"value"` — a specific value matches (use sparingly, values change)
- `"subjective"` — qualitative judgment, graded by the grader agent

---

## timing.json — Run Performance Data

Written per run `<workspace>/iteration-N/eval-<ID>/with_skill/timing.json`.

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

**Important:** This must be saved immediately when the subagent completes — the notification
message contains `total_tokens` and `duration_ms` and this is the only chance to capture it.

---

## grading.json — Grading Results

Written by the grader subagent per run `<workspace>/iteration-N/eval-<ID>/with_skill/grading.json`.

```json
{
  "eval_id": 1,
  "config": "with_skill",
  "grader_notes": "Output was complete and correctly used tokens. Hover state was implemented.",
  "expectations": [
    {
      "text": "The output includes a working CSS class for hover state",
      "passed": true,
      "evidence": "Found .item:hover { background: var(--card-hover); } at line 412"
    },
    {
      "text": "No hardcoded color values",
      "passed": false,
      "evidence": "Found '#1a1a2e' inline at line 389 — not a token"
    }
  ]
}
```

---

## benchmark.json — Aggregated Benchmark

Written by `scripts/aggregate_benchmark.py` to `<workspace>/iteration-N/benchmark.json`.

```json
{
  "skill_name": "example-skill",
  "workspace": "example-skill-workspace/iteration-1",
  "summary": [
    {
      "config": "with_skill",
      "label": "With Skill",
      "pass_rate": 0.83,
      "pass_rate_stddev": 0.17,
      "n_evals": 3,
      "avg_duration_s": 28.4,
      "stddev_duration_s": 4.1,
      "avg_tokens": 91200,
      "stddev_tokens": 12300
    },
    {
      "config": "without_skill",
      "label": "Without Skill",
      "pass_rate": 0.50,
      "pass_rate_stddev": 0.22,
      "n_evals": 3,
      "avg_duration_s": 21.1,
      "stddev_duration_s": 3.0,
      "avg_tokens": 72000,
      "stddev_tokens": 8400
    }
  ],
  "per_eval": [
    {
      "eval_id": 1,
      "eval_name": "hover-state-tokens",
      "config": "with_skill",
      "pass_rate": 1.0,
      "duration_s": 31.2,
      "tokens": 88000,
      "assertions": []
    }
  ],
  "analyst_notes": "Non-discriminating: none. High-variance: eval-2 (100% vs mean 83%). ..."
}
```

---

## feedback.json — Human Reviewer Feedback

Exported from the eval review HTML by the reviewer clicking "Submit All Reviews".
Saved to `<workspace>/iteration-N/feedback.json`.

```json
{
  "reviews": [
    {
      "run_id": "eval-1-with_skill",
      "feedback": "The hover state was there but the colors felt off — too bright vs the rest of the screen",
      "timestamp": "2026-06-18T14:23:11.000Z"
    },
    {
      "run_id": "eval-2-with_skill",
      "feedback": "",
      "timestamp": "2026-06-18T14:24:02.000Z"
    }
  ],
  "status": "complete"
}
```

Empty `feedback` string = no issues found for that eval.

---

## trigger_eval.json — Description Optimization Queries

Input to `scripts/run_loop.py`. Created manually or via the `assets/eval_review.html` tool.

```json
[
  {
    "query": "create a new CSS hover state for the product card using our design tokens",
    "should_trigger": true
  },
  {
    "query": "review the backend for SQL injection vulnerabilities",
    "should_trigger": false
  },
  {
    "query": "I want to build a new screen from scratch",
    "should_trigger": true
  }
]
```

**Guidelines for writing good trigger eval queries:**
- Should-trigger: phrases a real user would say when they need this skill
- Should-not-trigger: near-misses — related topic but clearly different intent
- Avoid obviously irrelevant queries (too easy to score well)
- 20 queries is a good target: 12 should-trigger, 8 should-not-trigger
