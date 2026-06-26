# User Surveys — autonomous product-quality panels

The autopilot periodically simulates a panel of ~100 expert reviewers (steered by the
domain subagents — `gabbana` for design, `ayalon` for product, etc.) using the live app.
Each survey lands here as one dated file.

## File naming
`YYYY-MM-DD-<target>.md`  (e.g. `2026-06-27-store.md`, `2026-06-27-feed-buy-button.md`)

## What each survey file contains
- **Target** — the screen or feature surveyed, and a screenshot reference.
- **Panel** — ~100 expert reviewers; which domain lens (design / product / commerce).
- **Metrics** — chosen to fit the target (satisfaction 1-10, confusion / drop-off points,
  purchase intent, competitor benchmark...).
- **Charts** — 2-4 PNGs generated via `scripts/chart.py`.
- **Conclusions** — bullet points.
- **Actions** — "Fixed now" (small/obvious issues fixed in the same run) vs
  "Proposed to IDEAS" (bigger recommendations awaiting founder approval).

## Severe findings
If a target scores an average **< 4/10**, the run also sends a special Telegram alert and
adds a line to `NEEDS_YOU.md`.

Each survey is standalone — no comparison against previous surveys.
All survey content is written in English.
