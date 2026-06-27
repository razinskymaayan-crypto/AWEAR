# Agent Contributions Ledger

Every autopilot run that delegates work appends a line here, so the **daily team report**
(22:00 Israel) can show who worked, how much, and on what — per agent.

## Format
One file per UTC day: `YYYY-MM-DD.md`. Each delegated agent gets one row:

```
| HH:MM | <agent> | <manager> | ~<tokens> | <one line of what they did> |
```

- `HH:MM` — UTC time of the run.
- `<agent>` — the IC who actually did the work (dolce, valentino, sam, oren, gabbana, netta, shira...).
- `<manager>` — the manager who routed it (mark / steve / ayalon), or `-`.
- `~<tokens>` — a ROUGH estimate (order of magnitude). Reported as an estimate, not exact.
- last column — a one-line English summary of the contribution.

`scripts/daily_report.py` reads the current day's file (plus that day's `activity_log.md`
entries) to build the per-agent graph + report. Mobile agents (dana/roei/varan) are dormant
and normally absent.
