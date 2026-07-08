#!/usr/bin/env python3
"""Self-heal watchdog — the loop the 2026-07-08 bcrypt incident exposed.

Back then the SAME gate failure ("steve(pytest)") repeated 6 cycles in a row and NOTHING
noticed — a human did. This closes that gap: it reads the durable gate-ledger, detects a
STUCK repeat (the newest cycles all failing the same way), and turns it into a top-priority
[UNRESOLVED] self-heal task + a Telegram alert — so the system flags and fixes its OWN
repeats instead of waiting for a founder to spot "nothing is progressing".

Key design choices:
- Only fires on CONSECUTIVE failures ending at the most recent cycle (an ACTIVE stuck loop).
  A success anywhere at the end clears it — no false alarms on already-resolved history.
- Idempotent: won't re-file while the same signature is still [UNRESOLVED].
- The task explicitly says "root-cause the GATE/WORKFLOW too, not just the lane's code" —
  because the bcrypt loop was a false-rejecting gate, not broken code.

Run after every jeff-merge cycle (right after the ledger line is written). Exit 0 always
(a watchdog must never fail the pipeline it watches).
"""
import os
import re
import subprocess
import datetime

LEDGER = "ci-debug/gate-ledger.md"
CIFAIL = ".claude/agents/knowledge/CI_FAILURES.md"
THRESHOLD = 3  # same failure this many cycles IN A ROW (ending now) => stuck loop


def _read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def _line_signature(line):
    """Return the failure signature for a ledger line, or None if the cycle was clean.

    'REVERTED (...): steve(pytest)' -> 'steve(pytest)'
    'REJECTED (...): mark'          -> 'mark'
    'jeff: merged -> steve'         -> None (a success clears the streak)
    """
    m = re.search(r"(?:REVERTED|REJECTED)[^:]*:\s*([^|]+)", line)
    return m.group(1).strip() if m else None


def _consecutive_repeat(ledger_text):
    """Longest run of the identical failure signature ending at the newest line."""
    lines = [ln for ln in ledger_text.splitlines() if "|" in ln]
    streak_sig, streak = None, 0
    for line in reversed(lines):
        sig = _line_signature(line)
        if sig is None:
            break  # a clean/success cycle breaks the streak
        if streak_sig is None:
            streak_sig, streak = sig, 1
        elif sig == streak_sig:
            streak += 1
        else:
            break
    return streak_sig, streak


def main():
    sig, streak = _consecutive_repeat(_read(LEDGER))
    if not sig or streak < THRESHOLD:
        print(f"self-heal: no stuck loop (top streak: {sig!r} x{streak})")
        return
    marker = f"REPEAT-FAILURE: {sig}"
    cifail = _read(CIFAIL)
    if "[UNRESOLVED]" in cifail and marker in cifail:
        print(f"self-heal: '{sig}' already filed [UNRESOLVED] — idempotent skip")
        return
    stamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    entry = f"""
## [UNRESOLVED] {marker} ({stamp})
The gate-ledger shows the SAME failure **{streak} cycles in a row (ending now)**: `{sig}`.
This is a STUCK LOOP — a lane keeps producing work the gate keeps rejecting the same way, so
nothing lands. Do NOT just retry. ROOT-CAUSE it:
- Is the lane's CODE genuinely wrong? Reproduce locally, fix it in the lane.
- OR is the GATE/WORKFLOW wrong (flaky check, deps installed before the merge, a bad command,
  a timeout)? Fix it in .github/workflows/ — a false-rejecting gate is as harmful as bad code.
  (The 2026-07-08 bcrypt loop was exactly this: pytest ran before a new dep was installed.)
Verify the fix, then change [UNRESOLVED] -> [FIXED] with a one-line note of the root cause.
"""
    with open(CIFAIL, "a", encoding="utf-8") as f:
        f.write(entry)
    print(f"::warning::self-heal: filed REPEAT-FAILURE '{sig}' (x{streak}) as [UNRESOLVED]")

    tok, chat = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if tok and chat:
        msg = (f"AWEAR self-heal: same gate failure {streak}x in a row -> '{sig}'. "
               f"Filed a top-priority root-cause task ([UNRESOLVED]); the loop will fix it "
               f"or escalate with a diagnosis. No action needed from you yet.")
        try:
            subprocess.run(
                ["curl", "-s", "-X", "POST",
                 f"https://api.telegram.org/bot{tok}/sendMessage",
                 "--data-urlencode", f"chat_id={chat}",
                 "--data-urlencode", f"text={msg}"],
                timeout=15, check=False)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # a watchdog must never break the pipeline it watches
        print(f"self-heal: non-fatal error: {exc}")
