# jeff-merge GATE 3 stale ownership map — steve stuck-loop root cause (2026-07-17)

## Symptom
`auto/steve` rejected 4 cycles in a row (2026-07-16T08:28 / 14:12 / 19:43, 2026-07-17T03:11) with
"lane-ownership violation — steve owns app.py/schema.sql only", always for the same in-lane work:
`static/data/products.json` (dead image fix) + `scripts/check_image_urls.py` + `scripts/data_integrity_check.py`
(commit f39f8fb, demo-reliability task A6). Self-heal watchdog filed it as [UNRESOLVED] REPEAT-FAILURE.

## Root cause (gate, not lane code)
`.github/workflows/jeff-merge.yml` GATE 3's adversarial-reviewer prompt embeds an ownership map that is
**stale on two counts**:
1. `steve: app.py/schema.sql` — but the lane SoT (autopilot-managers.yml:96) says steve OWNS
   `app.py, schema.sql, static/data/*.json, scripts/*.py`, and GATE 0's deterministic DENY list for steve
   (jeff-merge.yml:64) agrees (it does NOT block static/data or scripts).
2. `oren: static/data+scripts` — **there is no oren lane.** The manager matrix is mark/steve/ayalon only;
   autopilot-managers.yml:89 states "oren's data work folds into steve's backend" (oren is steve's IC).

So GATE 0 (deterministic) passes the diff, then GATE 3's LLM reviewer — told the wrong map — rejects it.
A grey zone GATE 0 deliberately delegates to GATE 3 is decided by a map that contradicts GATE 0 itself
(OW-006: the mechanism enforced the wrong rule).

## Fix (in `notes/jeff-merge-base-anchor.patch`, regenerated as a COMBINED patch)
- GATE 3 prompt map corrected: `steve: app.py/schema.sql/static/data/scripts/tests — oren is steve's IC,
  not a lane`; adds an explicit shared-bookkeeping clause (notes/, ci-debug/, NEEDS_*.md, .claude/agents/
  logs writable by every lane) so the reviewer stops treating bookkeeping as violations.
- Retains ayalon's 2026-07-13 BASE-anchor fix unchanged (per-lane `BASE=$(git rev-parse HEAD)`; all gate
  diffs/resets anchored to `"$BASE"`). Combined because both patches touch the same lines/context —
  two sequential patches would conflict; one file = one founder command.

## Why a patch and not a direct edit (OW-013)
GATE 0 denies `.github/` for the steve lane, and the running workflow is always main's version — a lane
commit touching jeff-merge.yml would add an instant deterministic rejection on top of the existing loop.
Founder applies on main: `git apply notes/jeff-merge-base-anchor.patch` → commit → push.

## Verification performed (steve run, branch auto/steve)
- Working-tree jeff-merge.yml confirmed byte-identical to origin/main's (`git diff --quiet origin/main HEAD -- …`).
- Fixed file: `yaml.safe_load` OK; embedded run script extracted → `bash -n` exit 0; only remaining
  `origin/main` refs are the initial checkout + comments (9 `"$BASE"` anchors in the gate loop).
- Patch: python hunk-applier replayed the patch onto a pristine copy of main's file — output byte-identical
  to the fixed version; corrected map string present.
- Health: `npm install` + `npm run check-render` green on the branch.

## Status
Escalated in NEEDS_YOU.md (2026-07-17 entry, folded into the existing 2026-07-13 gate-fix item) + Telegram.
CI_FAILURES.md steve entry → [UNRESOLVED — ROOT-CAUSED, PATCH READY (combined), NEEDS FOUNDER APPLY] with a
check-then-stop instruction for the next agent. The pending in-lane work on auto/steve (f39f8fb) needs NO
rework — it merges cleanly the first cycle after the patch lands.
