# Failures Log — for the daily retrospective to learn from

Whenever a run breaks the app (auto-rollback / verification caught a regression after the fact),
the autopilot appends the root cause here. The daily retrospective reads this, turns each failure
into a durable rule, and checks whether it REPEATS a rule that already existed.

## Format
```
| YYYY-MM-DD | what broke | root cause | rule it violated (or "new") |
```

---
