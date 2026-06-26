# CI Failures — autonomous self-healing queue

`scripts/detect_ci_failure.sh` runs at the start of every autopilot run. If the PREVIOUS run
failed, it appends the failed step's log tail here as an `[UNRESOLVED]` entry. The autopilot
then treats fixing it as top-priority (SAFETY FIRST): diagnose → fix (app code OR the workflow
itself) → verify → mark `[FIXED]` → report to Telegram. All without a human.

## Format
```
## [UNRESOLVED] run <id> — failed at: <step> (<timestamp>)
` ` `
<last 40 lines of the failed step's log>
` ` `
```
The autopilot changes `[UNRESOLVED]` → `[FIXED]` with a one-line note once handled.

---
