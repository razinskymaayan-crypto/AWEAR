#!/usr/bin/env python3
"""Reusable chart helper for the AWEAR autopilot's user-survey reports.

Usage:
    python3 scripts/chart.py <out.png> '<json>'

JSON spec:
    {
      "title":  "Feed satisfaction (n=100 expert reviewers)",
      "type":   "bar" | "grouped" | "line",
      "labels": ["Visual", "Clarity", "Shoppability", ...],
      "series": [ {"name": "Score", "values": [8.1, 6.4, 7.2, ...]}, ... ],
      "ylabel": "1-10"
    }

Fails soft: if matplotlib is missing or the spec is bad, prints a clear message
and exits non-zero so the caller can fall back to a text/doc-only report.
Brand colors are hardcoded here on purpose — this is an internal reporting
script, not app UI chrome, so the no-hardcoded-hex rule does not apply.
"""
import sys
import json

# AWEAR Mediterranean-Modern palette (dark).
BG = "#0e0c0f"
FG = "#f0ecf5"
GRID = "#2e2836"
SERIES_COLORS = ["#e8526a", "#c4855a", "#7a6af0", "#52c97a", "#e8a84a", "#e05252"]


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: chart.py <out.png> '<json>'")
        return 2
    out = sys.argv[1]
    try:
        spec = json.loads(sys.argv[2])
    except json.JSONDecodeError as e:
        print(f"chart.py: bad JSON: {e}")
        return 2

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("chart.py: matplotlib not installed — skipping chart "
              "(install with: pip install matplotlib)")
        return 3

    labels = spec.get("labels", [])
    series = spec.get("series", [])
    ctype = spec.get("type", "bar")
    title = spec.get("title", "")
    ylabel = spec.get("ylabel", "")
    if not labels or not series:
        print("chart.py: spec needs non-empty 'labels' and 'series'")
        return 2

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)

    n = len(labels)
    x = range(n)

    if ctype == "line":
        for i, s in enumerate(series):
            ax.plot(list(x), s["values"], marker="o", linewidth=2.5,
                    color=SERIES_COLORS[i % len(SERIES_COLORS)], label=s.get("name", ""))
    else:  # bar or grouped
        groups = len(series)
        width = 0.8 / max(groups, 1)
        for i, s in enumerate(series):
            offset = (i - (groups - 1) / 2) * width
            ax.bar([xi + offset for xi in x], s["values"], width=width,
                   color=SERIES_COLORS[i % len(SERIES_COLORS)], label=s.get("name", ""))

    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, color=FG, fontsize=10, rotation=15, ha="right")
    ax.set_title(title, color=FG, fontsize=13, fontweight="bold", pad=14)
    if ylabel:
        ax.set_ylabel(ylabel, color=FG, fontsize=10)
    ax.tick_params(colors=FG)
    for spine in ax.spines.values():
        spine.set_color(GRID)
    ax.grid(axis="y", color=GRID, linewidth=0.7, alpha=0.6)
    if len(series) > 1 or any(s.get("name") for s in series):
        leg = ax.legend(facecolor=BG, edgecolor=GRID, labelcolor=FG, fontsize=9)
    fig.tight_layout()
    fig.savefig(out, facecolor=BG, bbox_inches="tight")
    print(f"chart.py: saved {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
