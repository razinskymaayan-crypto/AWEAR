#!/usr/bin/env python3
"""
Aggregate benchmark results from an iteration workspace.

Usage:
    python aggregate_benchmark.py <workspace/iteration-N> --skill-name <name>

Reads grading.json and timing.json from each eval's run directories.
Outputs benchmark.json and benchmark.md in the iteration directory.
"""

import argparse
import json
import math
import sys
from pathlib import Path


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = mean(values)
    return math.sqrt(sum((v - m) ** 2 for v in values) / (len(values) - 1))


def load_run(run_dir: Path) -> dict:
    result = {"pass_rate": None, "duration_s": None, "tokens": None, "assertions": []}

    timing_path = run_dir / "timing.json"
    if timing_path.exists():
        try:
            t = json.loads(timing_path.read_text())
            result["duration_s"] = t.get("total_duration_seconds")
            result["tokens"] = t.get("total_tokens")
        except Exception:
            pass

    grading_path = run_dir / "grading.json"
    if grading_path.exists():
        try:
            g = json.loads(grading_path.read_text())
            expectations = g.get("expectations", [])
            if expectations:
                passed = sum(1 for e in expectations if e.get("passed"))
                result["pass_rate"] = passed / len(expectations)
                result["assertions"] = expectations
        except Exception:
            pass

    return result


def main():
    parser = argparse.ArgumentParser(description="Aggregate benchmark results")
    parser.add_argument("workspace", help="Path to iteration workspace directory")
    parser.add_argument("--skill-name", default="skill", help="Skill name")
    args = parser.parse_args()

    workspace = Path(args.workspace)
    if not workspace.exists():
        print(f"Error: workspace not found: {workspace}", file=sys.stderr)
        sys.exit(1)

    # Collect per-eval data
    per_eval = []
    config_data: dict[str, dict] = {}  # config -> {pass_rates, durations, tokens}

    for eval_dir in sorted(workspace.iterdir()):
        if not eval_dir.is_dir():
            continue
        meta_path = eval_dir / "eval_metadata.json"
        if not meta_path.exists():
            continue

        try:
            meta = json.loads(meta_path.read_text())
        except Exception:
            continue

        eval_name = meta.get("eval_name", eval_dir.name)
        eval_id = meta.get("eval_id", eval_dir.name)

        for run_type in ("with_skill", "without_skill", "old_skill"):
            run_dir = eval_dir / run_type
            if not run_dir.exists():
                continue

            data = load_run(run_dir)
            per_eval.append({
                "eval_id": eval_id,
                "eval_name": eval_name,
                "config": run_type,
                "pass_rate": data["pass_rate"],
                "duration_s": data["duration_s"],
                "tokens": data["tokens"],
                "assertions": data["assertions"],
            })

            if run_type not in config_data:
                config_data[run_type] = {"pass_rates": [], "durations": [], "tokens": []}
            if data["pass_rate"] is not None:
                config_data[run_type]["pass_rates"].append(data["pass_rate"])
            if data["duration_s"] is not None:
                config_data[run_type]["durations"].append(data["duration_s"])
            if data["tokens"] is not None:
                config_data[run_type]["tokens"].append(data["tokens"])

    # Build summary
    config_labels = {"with_skill": "With Skill", "without_skill": "Without Skill", "old_skill": "Previous Skill"}
    summary = []
    for config in ("with_skill", "old_skill", "without_skill"):
        if config not in config_data:
            continue
        d = config_data[config]
        pr = d["pass_rates"]
        dur = d["durations"]
        tok = d["tokens"]
        summary.append({
            "config": config,
            "label": config_labels.get(config, config),
            "pass_rate": mean(pr) if pr else None,
            "pass_rate_stddev": stddev(pr) if pr else None,
            "n_evals": len(pr),
            "avg_duration_s": mean(dur) if dur else None,
            "stddev_duration_s": stddev(dur) if dur else None,
            "avg_tokens": mean(tok) if tok else None,
            "stddev_tokens": stddev(tok) if tok else None,
        })

    # Delta: with_skill vs. without_skill (or old_skill)
    baseline_config = "old_skill" if "old_skill" in config_data else "without_skill"
    delta_note = ""
    if "with_skill" in config_data and baseline_config in config_data:
        ws_pr = mean(config_data["with_skill"]["pass_rates"]) if config_data["with_skill"]["pass_rates"] else None
        bl_pr = mean(config_data[baseline_config]["pass_rates"]) if config_data[baseline_config]["pass_rates"] else None
        if ws_pr is not None and bl_pr is not None:
            delta = ws_pr - bl_pr
            direction = "↑" if delta > 0 else ("↓" if delta < 0 else "→")
            delta_note = f"{direction} {abs(delta)*100:.1f}pp vs. {config_labels.get(baseline_config, baseline_config)}"

    # Analyst notes (basic pattern detection)
    analyst_notes = []

    # Non-discriminating assertions: pass rate ≥ 95% in both configs
    all_assertion_names: dict[str, list] = {}
    for row in per_eval:
        for a in row.get("assertions", []):
            name = a.get("text", "?")
            if name not in all_assertion_names:
                all_assertion_names[name] = []
            all_assertion_names[name].append(a.get("passed", False))

    non_discriminating = [n for n, results in all_assertion_names.items()
                          if results and sum(results) / len(results) >= 0.95]
    if non_discriminating:
        analyst_notes.append(
            f"Non-discriminating assertions (always pass — may not be testing skill impact):\n"
            + "\n".join(f"  • {n}" for n in non_discriminating)
        )

    # High-variance evals
    eval_variances = []
    for row in per_eval:
        if row["pass_rate"] is not None and row["config"] == "with_skill":
            eval_variances.append((row["eval_name"], row["pass_rate"]))

    if eval_variances:
        pr_values = [v for _, v in eval_variances]
        overall_mean = mean(pr_values)
        for name, pr in eval_variances:
            if abs(pr - overall_mean) > 0.3:
                analyst_notes.append(f"High-variance eval: '{name}' (pass rate {pr*100:.0f}% vs mean {overall_mean*100:.0f}%)")

    if delta_note:
        analyst_notes.insert(0, f"Overall delta: {delta_note}")

    # Build output
    benchmark = {
        "skill_name": args.skill_name,
        "workspace": str(workspace),
        "summary": summary,
        "per_eval": per_eval,
        "analyst_notes": "\n\n".join(analyst_notes) if analyst_notes else "No significant patterns detected.",
    }

    benchmark_path = workspace / "benchmark.json"
    benchmark_path.write_text(json.dumps(benchmark, indent=2, ensure_ascii=False))
    print(f"Wrote {benchmark_path}")

    # Markdown summary
    md_lines = [f"# Benchmark — {args.skill_name}\n"]
    md_lines.append("## Summary\n")
    md_lines.append("| Config | Pass Rate | ± | Avg Time | Avg Tokens |")
    md_lines.append("|--------|-----------|---|----------|------------|")
    for row in summary:
        pr = f"{row['pass_rate']*100:.0f}%" if row["pass_rate"] is not None else "—"
        sd = f"±{row['pass_rate_stddev']*100:.0f}pp" if row["pass_rate_stddev"] else ""
        dur = f"{row['avg_duration_s']:.1f}s" if row["avg_duration_s"] else "—"
        tok = f"{int(row['avg_tokens']):,}" if row["avg_tokens"] else "—"
        md_lines.append(f"| {row['label']} | {pr} | {sd} | {dur} | {tok} |")

    if delta_note:
        md_lines.append(f"\n**{delta_note}**")

    md_lines.append("\n## Analyst Notes\n")
    md_lines.append(benchmark["analyst_notes"])

    md_path = workspace / "benchmark.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
