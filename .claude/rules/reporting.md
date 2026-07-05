# Reporting protocol — every completed task ends with exactly this block

This is the API between agents and the management layer (and the future management app): every agent in every project emits it; approvals/rejections against it feed the learnings files.

```
TASK: <one line>
TIER: S/M/L
CHANGED: <files>
WHY: <one line>
VERIFIED: <how — tests/lint/evals/review/curl/render; name the actual commands run>
CONFIDENCE: high/medium/low + one-line risk
NEEDS HUMAN: yes/no + what exactly
```

Rules:
- `VERIFIED:` names real evidence (command + result), never "should work". If something is unverifiable, say so explicitly here — nothing unverifiable ships silently.
- `NEEDS HUMAN: yes` items also get a `NEEDS_DECISION.md` entry (options + recommendation + default applied).
- **Rejection → learning**: when a human (or the jeff-merge gate) rejects a report, the responsible agent converts the rejection into a knowledge entry (domain file + INDEX row) BEFORE its next task. A rejection without a learning is a repeat waiting to happen.
- S-tier may compress to one line but keeps the field labels: `TASK: fix typo | TIER: S | CHANGED: x.md | VERIFIED: grep | CONFIDENCE: high | NEEDS HUMAN: no`.
