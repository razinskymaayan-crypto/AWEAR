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

## [FIXED] run 28462417666 — failed at: Run autopilot (one task) (2026-06-30T19:13Z)
> FIXED 2026-06-30 (oren/steve): the tail below is post-job cleanup noise, NOT the failed step. Real cause unrecoverable from here (gh/API unreachable; app healthy via check-render; likely a 30-min timeout or transient claude-CLI/API error). Fixed the *blindness*: detect_ci_failure.sh now captures the FAILED STEP's log (per-step run-logs zip, noise-filtered) + source/likely_cause tags, so future failures are diagnosable.
```
2026-06-30T17:15:36.2731260Z [36;1mfi[0m
2026-06-30T17:15:36.2731517Z [36;1mif echo "$FILES" | grep -q "INBOX.md"; then[0m
2026-06-30T17:15:36.2732014Z [36;1m  send "AWEAR — a task is done. An agent finished a task you gave. Check INBOX.md on GitHub."[0m
2026-06-30T17:15:36.2732473Z [36;1mfi[0m
2026-06-30T17:15:36.2763358Z shell: /usr/bin/bash -e {0}
2026-06-30T17:15:36.2763616Z env:
2026-06-30T17:15:36.2763982Z   TG_TOKEN: ***

2026-06-30T17:15:36.2764476Z   TG_CHAT: ***
2026-06-30T17:15:36.2764992Z ##[endgroup]
2026-06-30T17:15:36.2956205Z ##[group]Run [ -z "$TG_TOKEN" ] && exit 0
2026-06-30T17:15:36.2956576Z [36;1m[ -z "$TG_TOKEN" ] && exit 0[0m
2026-06-30T17:15:36.2956983Z [36;1mLAST=$(git log -1 --pretty=%s 2>/dev/null || echo "no commit")[0m
2026-06-30T17:15:36.2957514Z [36;1mcurl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \[0m
2026-06-30T17:15:36.2957979Z [36;1m     --data-urlencode chat_id="$TG_CHAT" \[0m
2026-06-30T17:15:36.2958508Z [36;1m     --data-urlencode text="AWEAR autopilot — run status: failure. Latest commit: ${LAST}" \[0m
2026-06-30T17:15:36.2959021Z [36;1m     >/dev/null || true[0m
2026-06-30T17:15:36.2989146Z shell: /usr/bin/bash -e {0}
2026-06-30T17:15:36.2989413Z env:
2026-06-30T17:15:36.2989741Z   TG_TOKEN: ***

2026-06-30T17:15:36.2990006Z   TG_CHAT: ***
2026-06-30T17:15:36.2990224Z ##[endgroup]
2026-06-30T17:15:36.3229310Z Node 20 is being deprecated. This workflow is running with Node 24 by default. If you need to temporarily use Node 20, you can set the ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true environment variable. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
2026-06-30T17:15:36.3230631Z Post job cleanup.
2026-06-30T17:15:36.4134403Z [command]/usr/bin/git version
2026-06-30T17:15:36.4175455Z git version 2.54.0
2026-06-30T17:15:36.4249363Z Temporarily overriding HOME='/home/runner/work/_temp/31bfee32-21ad-46fe-bf70-f59a28912f63' before making global git config changes
2026-06-30T17:15:36.4251222Z Adding repository directory to the temporary git global config as a safe directory
2026-06-30T17:15:36.4256810Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/AWEAR/AWEAR
2026-06-30T17:15:36.4296097Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-06-30T17:15:36.4345463Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-06-30T17:15:36.4609916Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-06-30T17:15:36.4637009Z http.https://github.com/.extraheader
2026-06-30T17:15:36.4648669Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-06-30T17:15:36.4693112Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-06-30T17:15:36.4920730Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-06-30T17:15:36.4954057Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-06-30T17:15:36.5332328Z Cleaning up orphan processes
2026-06-30T17:15:36.5611069Z ##[warning]Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
```

## [UNRESOLVED — ROOT-CAUSED, PATCH READY, NEEDS FOUNDER APPLY] REPEAT-FAILURE: ayalon(ownership) — see ci-debug/jeff-rejections.txt (2026-07-13T03:10:30Z)
> Re-checked 2026-07-13 (mark run): grep -c 'BASE=' on origin/main jeff-merge.yml = 0 — patch STILL NOT applied. Founder re-pinged via Telegram. Next agent: same check, do not re-analyze.
**FIXED 2026-07-13 (ayalon self-heal):** false-rejecting gate, not lane code. jeff-merge merges lanes sequentially into one local main, but GATE 0/1.5/3 diffed `origin/main...HEAD` — so after an earlier lane merged, the later lane was blamed for its files (ledger proof: every `REJECTED: X(ownership)` cycle had `merged -> Y` earlier, X rejected for exactly Y's files); the rejection's hard rollback to origin/main also destroyed the earlier lane's approved merge before push while its branch was deleted as merged. Fix: per-lane `BASE=$(git rev-parse HEAD)` anchor for every gate diff + rollback in the loop. APPLY: `git apply notes/jeff-merge-base-anchor.patch` on main (see NEEDS_YOU.md) — lane runs cannot land .github/ changes: the running gate is always main's version and old GATE 0 denies .github/ for docs lanes; lane agents have no push beyond HEAD:auto/<lane> (OW-013). NEXT AGENT: if the patch is already applied on main (grep 'BASE=' .github/workflows/jeff-merge.yml), flip this entry to [FIXED]; if not, re-ping the founder — do NOT re-analyze. Verified: scratch-repo repro (old diff blames docs lane for app.py, BASE diff does not), yaml parse + bash -n green.
The gate-ledger shows the SAME failure **3 cycles in a row (ending now)**: `ayalon(ownership) — see ci-debug/jeff-rejections.txt`.
This is a STUCK LOOP — a lane keeps producing work the gate keeps rejecting the same way, so
nothing lands. Do NOT just retry. ROOT-CAUSE it:
- Is the lane's CODE genuinely wrong? Reproduce locally, fix it in the lane.
- OR is the GATE/WORKFLOW wrong (flaky check, deps installed before the merge, a bad command,
  a timeout)? Fix it in .github/workflows/ — a false-rejecting gate is as harmful as bad code.
  (The 2026-07-08 bcrypt loop was exactly this: pytest ran before a new dep was installed.)
Verify the fix, then change [UNRESOLVED] -> [FIXED] with a one-line note of the root cause.
