#!/usr/bin/env python3
"""
Description optimization loop — iteratively improves a skill's description
for better triggering accuracy using the claude CLI.

Usage:
    python run_loop.py \
      --eval-set trigger_eval.json \
      --skill-path .claude/skills/<name>/SKILL.md \
      --model claude-sonnet-4-6 \
      --max-iterations 5 \
      --verbose

Input eval-set JSON:
    [{"query": "user prompt", "should_trigger": true}, ...]

Output: best_description (string), results per iteration, and a summary report.
"""

import argparse
import json
import random
import re
import subprocess
import sys
from pathlib import Path


def read_skill_description(skill_path: Path) -> str:
    content = skill_path.read_text(encoding="utf-8")
    match = re.search(r"^description:\s*(.+?)(?=\n[a-z]|\n---)", content, re.MULTILINE | re.DOTALL)
    if not match:
        raise ValueError(f"Could not find description in {skill_path}")
    desc = match.group(1).strip()
    # Strip surrounding quotes if present
    if (desc.startswith('"') and desc.endswith('"')) or (desc.startswith("'") and desc.endswith("'")):
        desc = desc[1:-1]
    return desc


def write_skill_description(skill_path: Path, new_description: str) -> None:
    content = skill_path.read_text(encoding="utf-8")
    new_content = re.sub(
        r"(^description:\s*)(.+?)(?=\n[a-z-]|\n---)",
        lambda m: f"{m.group(1)}{new_description}",
        content,
        flags=re.MULTILINE | re.DOTALL,
    )
    skill_path.write_text(new_content, encoding="utf-8")


def evaluate_description(description: str, query: str, model: str, verbose: bool) -> bool:
    """
    Ask Claude: given this description and this query, would you trigger the skill?
    Returns True if Claude says yes (should trigger), False otherwise.
    """
    prompt = f"""You are deciding whether to invoke a skill. The skill has this description:

---
{description}
---

The user sent this message:
"{query}"

Respond with ONLY "yes" if you would invoke this skill for this user message, or "no" if you would not.
Do not explain — just "yes" or "no"."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--model", model],
            capture_output=True,
            text=True,
            timeout=60,
        )
        response = result.stdout.strip().lower()
        triggered = response.startswith("yes")
        if verbose:
            print(f"    Query: {query[:60]}... → {'YES' if triggered else 'NO'}")
        return triggered
    except subprocess.TimeoutExpired:
        if verbose:
            print(f"    Timeout on query: {query[:60]}...")
        return False
    except FileNotFoundError:
        print("Error: 'claude' CLI not found. Make sure Claude Code is installed and in PATH.")
        sys.exit(1)


def score_description(description: str, eval_set: list[dict], model: str, runs_per_query: int, verbose: bool) -> dict:
    """
    Score a description on the eval set.
    Returns {accuracy, false_positives, false_negatives, total, results_per_query}
    """
    results = []
    for item in eval_set:
        query = item["query"]
        should_trigger = item["should_trigger"]
        vote_yes = 0

        for _ in range(runs_per_query):
            triggered = evaluate_description(description, query, model, verbose)
            if triggered:
                vote_yes += 1

        majority = vote_yes > (runs_per_query / 2)
        correct = majority == should_trigger
        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "actual_trigger": majority,
            "correct": correct,
            "vote_yes": vote_yes,
            "runs": runs_per_query,
        })

    correct_count = sum(1 for r in results if r["correct"])
    fp = sum(1 for r in results if not r["should_trigger"] and r["actual_trigger"])
    fn = sum(1 for r in results if r["should_trigger"] and not r["actual_trigger"])
    accuracy = correct_count / len(results) if results else 0.0

    return {
        "accuracy": accuracy,
        "false_positives": fp,
        "false_negatives": fn,
        "total": len(results),
        "results": results,
    }


def propose_improvement(description: str, failures: list[dict], model: str) -> str:
    """
    Ask Claude to propose a better description given the failures.
    """
    failure_lines = "\n".join(
        f"- \"{r['query']}\" (should_trigger={r['should_trigger']}, triggered={r['actual_trigger']})"
        for r in failures
    )

    prompt = f"""You are improving the triggering description of a Claude skill.

Current description:
{description}

The description controls when Claude decides to invoke this skill.
These queries produced incorrect triggering decisions:

{failure_lines}

Write an improved description that would correctly handle these cases.
The description should:
1. Be concise (2-4 sentences max)
2. Clearly state what the skill does AND when to use it
3. Include specific triggering phrases if helpful
4. Not be overly broad (triggering on everything) or overly narrow (never triggering)

Return ONLY the new description text — no quotes, no explanation, no prefix."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--model", model],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"Error proposing improvement: {e}")
        return description


def main():
    parser = argparse.ArgumentParser(description="Optimize skill description for triggering accuracy")
    parser.add_argument("--eval-set", required=True, help="Path to trigger eval JSON")
    parser.add_argument("--skill-path", required=True, help="Path to SKILL.md")
    parser.add_argument("--model", default="claude-sonnet-4-6", help="Claude model to use")
    parser.add_argument("--max-iterations", type=int, default=5)
    parser.add_argument("--runs-per-query", type=int, default=3, help="Runs per query for reliability")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--output", help="Write results JSON to this path")
    args = parser.parse_args()

    skill_path = Path(args.skill_path)
    if not skill_path.exists():
        print(f"Error: skill not found at {skill_path}")
        sys.exit(1)

    eval_set = json.loads(Path(args.eval_set).read_text())
    if isinstance(eval_set, dict) and "evals" in eval_set:
        eval_set = eval_set["evals"]

    print(f"Loaded {len(eval_set)} eval queries")

    # 60/40 train/test split
    random.shuffle(eval_set)
    split = int(len(eval_set) * 0.6)
    train_set = eval_set[:split] if split > 0 else eval_set
    test_set = eval_set[split:] if split < len(eval_set) else eval_set

    print(f"Train: {len(train_set)}, Test: {len(test_set)}")

    current_description = read_skill_description(skill_path)
    print(f"\nInitial description:\n{current_description}\n")

    history = []
    best_description = current_description
    best_test_score = 0.0

    for iteration in range(args.max_iterations):
        print(f"\n--- Iteration {iteration + 1} / {args.max_iterations} ---")

        # Score on train set
        print("Scoring on train set...")
        train_results = score_description(
            current_description, train_set, args.model, args.runs_per_query, args.verbose
        )
        print(f"Train accuracy: {train_results['accuracy']*100:.0f}% "
              f"(FP={train_results['false_positives']}, FN={train_results['false_negatives']})")

        # Score on test set
        print("Scoring on test set...")
        test_results = score_description(
            current_description, test_set, args.model, args.runs_per_query, args.verbose
        )
        print(f"Test accuracy: {test_results['accuracy']*100:.0f}% "
              f"(FP={test_results['false_positives']}, FN={test_results['false_negatives']})")

        history.append({
            "iteration": iteration + 1,
            "description": current_description,
            "train_accuracy": train_results["accuracy"],
            "test_accuracy": test_results["accuracy"],
            "train_results": train_results,
            "test_results": test_results,
        })

        if test_results["accuracy"] > best_test_score:
            best_test_score = test_results["accuracy"]
            best_description = current_description
            print(f"New best test score: {best_test_score*100:.0f}%")

        if train_results["accuracy"] >= 1.0:
            print("Perfect train score — stopping early")
            break

        # Find failures on train set and propose improvement
        failures = [r for r in train_results["results"] if not r["correct"]]
        if not failures:
            print("No failures on train set — stopping")
            break

        print(f"\nProposing improvement based on {len(failures)} failure(s)...")
        new_description = propose_improvement(current_description, failures, args.model)

        if new_description and new_description != current_description:
            print(f"New description:\n{new_description}")
            current_description = new_description
        else:
            print("No improvement proposed — stopping")
            break

    # Final report
    print(f"\n{'='*50}")
    print(f"Optimization complete")
    print(f"Best test score: {best_test_score*100:.0f}%")
    print(f"\nBest description:\n{best_description}")
    print(f"\nOriginal description:\n{read_skill_description(skill_path)}")

    output = {
        "best_description": best_description,
        "best_test_score": best_test_score,
        "iterations": len(history),
        "history": history,
    }

    if args.output:
        Path(args.output).write_text(json.dumps(output, indent=2, ensure_ascii=False))
        print(f"\nResults written to {args.output}")

    print("\nTo apply the best description, update the 'description:' field in SKILL.md.")
    print("Use the before/after output above and verify it makes sense for your skill.")


if __name__ == "__main__":
    main()
