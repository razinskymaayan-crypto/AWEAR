# AWEAR Autonomy Engine — Redesign (2026-07-22)

Founder mandate: a system that fixes and builds ITSELF, never repeats mistakes, thinks deeply,
and drives real PRODUCT progress from a stable, PROVEN autonomous loop — where the agents
prioritize on their own (the founder should never have to triage bugs).

This doc is the plan. It is grounded in (a) the failures we actually observed, and (b) a deep
research pass (12 adversarially-verified findings). Where evidence is weak, it says so.

---

## 1. What actually went wrong (observed, not theorized)

| # | Failure we hit | Root cause (structural, not "lazy agent") |
|---|---|---|
| F1 | Nothing landed for days | Serial-merge diffed/reset vs origin/main → later lane blamed for earlier lane's files, rollback wiped approved work (FIXED: base-anchor) |
| F2 | mark repeated the SAME DS-004 3× | Rejection feedback never reached the next run (FIXED: 48h check) |
| F3 | Gate reverted steve's work 4× | Gate cannot tell "your code broke a test" from "your NEW test found a REAL pre-existing bug" (OPEN) |
| F4 | Live HTTP 500 on /follow survived days | We measure PROCESS health (tests pass, merge ok, page renders), never PRODUCT health — nothing ever called the endpoint (PARTIAL: health_sweep.py built) |
| F5 | Interaction test drove 2/21 overlays, reported "OK" | Coverage unmeasured → false confidence (PARTIAL: ux-audit.mjs + OW-015) |
| F6 | steve stuck in CONFLICT 8 cycles | A lane branch that falls behind and collides only on append-only LOG files is never auto-rebased; it rots (OPEN) |
| F7 | self-heal "detects but doesn't fix" | It files [UNRESOLVED] for a human; gate/conflict fixes are exactly what lanes are BLOCKED from landing → infinite re-ping (PARTIAL: routing added) |
| F8 | Agents work from a human wishlist (INBOX) | Work is not driven by MEASURED defects (OPEN — the big one) |

---

## 2. What the research says (12 verified claims → design force)

- **More agents ≠ better.** MAS gains over single-agent are often minimal; a single strong ReAct
  agent beat a multi-agent planner on all 5 benchmarks when coordination was weak. (arxiv 2503.13657, 2510.17109)
  → *Do not add agents. Consider REMOVING one. Coordination must earn its cost.*
- **Task verification is a top-3 MAS failure class** — not an implementation detail. (2503.13657)
  → *Our gate IS the problem surface; invest there.*
- **Flexible LLM-judge gates rubber-stamp failures** — up to 71% false-positive. Tightened structured
  gates flip to false-negatives (reject correct work — exactly F3). (2510.17109)
  → *Move decisions to DETERMINISTIC checks; keep the LLM judge advisory only, never a hard revert.*
- **Naive failure-memory accumulation HURTS** (noise in retrieval). Self-evolving/curated memory helps —
  but mostly for STRUCTURALLY RECURRING tasks (Pearson r≈0.72). (2511.20857)
  → *CI_FAILURES must be CURATED (dedup/expire/promote), not append-only. Learning pays off for our
    repetitive bug classes (DS-004, ownership, 500s), less for one-offs.*
- **Prompt/topology tweaks are insufficient** for recurring MAS failures — structural fixes needed. (2503.13657)
  → *Stop patching prompts; change the loop's inputs (defect-driven) and the gate's decision basis.*

---

## 3. The redesign — three structural changes

### CHANGE A — Drive work from MEASURED DEFECTS, not a wishlist (fixes F4, F5, F8)
The single biggest lever. Build one **health scan** that runs every cycle and EMITS the backlog:
- `scripts/health_sweep.py` — every route, reports 5xx (built ✅)
- `scripts/ux-audit.mjs` — every overlay/contrast/overlap (built ✅)
- NEW: merge both into `ci-debug/product-defects.json`, each defect scored `severity × centrality`.
- The lane prompt's task priority becomes: **"fix the highest-scored open defect"** BEFORE the INBOX.
- Coverage (N/M) is reported every run (OW-015). A defect the scan can't see yet = a coverage gap = its own task.
- INBOX becomes founder DIRECTION only (vision/priorities), never the bug list.

### CHANGE B — Make the gate DETERMINISTIC + bug-aware (fixes F3, F7)
- The hard revert decision uses only deterministic checks (pytest, guard, render, ownership regex).
- **Bug-vs-regression rule:** if a lane's diff ADDS a failing test that fails on `$BASE` too (i.e. it
  exposed a PRE-EXISTING bug), do NOT revert the lane — file the exposed bug as a top-priority defect
  and land the test as `xfail`/quarantined. (This is exactly the steve-4×-revert failure.)
- The LLM adversarial judge stays, but ADVISORY: it can flag, it cannot hard-revert alone (research: loose
  judge = 71% FP). Its verdicts feed the defect list, not the merge decision.

### CHANGE C — Self-healing that actually HEALS (fixes F1-partial, F6, F7)
- **Auto-rebase stale lanes:** before merge, if `auto/<lane>` is behind main and conflicts ONLY on
  append-only logs (activity_log/STATE/CI_FAILURES/contributions), the engine rebases it automatically
  (union-merge already set in .gitattributes — extend to auto-resolve, not just union).
- **Curate CI_FAILURES:** self_heal dedups, expires resolved entries, and PROMOTES a recurring signature
  into a knowledge code (semantic memory) instead of stacking [UNRESOLVED] notes.
- **Escalation with teeth:** a fix only the main-session can land (`.github/`) is written to a single
  `ENGINE_TODO.md` the main session owns — not re-pinged every cycle burning runs.

### CHANGE D (candidate) — fewer, sharper agents / GitHub-native gate
- Evidence says more agents rarely help. Options to evaluate (NOT yet decided):
  (1) collapse ayalon (docs) into an on-demand task rather than a standing lane;
  (2) replace the hand-rolled serial-merge with GitHub **Merge Queue** + branch protection + CODEOWNERS —
      the base-anchor/conflict class disappears because GitHub tests each change against the accumulated
      main natively. Big change; needs a careful migration so the pipeline never fully breaks.

---

## 4. Sequenced rollout (each step independently verifiable, main-session owns .github/)
1. **Product-defect queue (Change A)** — merge the two scanners → scored `product-defects.json`; wire the
   lane prompt to it. *Highest value; turns the system defect-driven.*
2. **Bug-vs-regression gate rule (Change B)** — stop reverting test-exposed real bugs.
3. **Auto-rebase + CI_FAILURES curation (Change C)** — kill the stuck-conflict + infinite-reping classes.
4. **Evaluate Change D** — measure whether removing a lane / going GitHub-native helps; decide with the founder.

## 5. Honest uncertainty
- Merge Queue migration could destabilize the loop mid-flight — do it behind a flag, keep the current gate
  until proven.
- "Fewer agents is better" is benchmark evidence, not a guarantee for OUR task mix — treat Change D as an
  experiment with a rollback, not a fait accompli.
- Defect scoring (`severity × centrality`) is a heuristic; it will need tuning once real defect volume flows.
