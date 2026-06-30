#!/bin/bash
# founder_questions_surface.sh — SessionStart hook.
# If FOUNDER_QUESTIONS.md has open questions, inject them so the assistant raises them
# with the founder immediately. Silent no-op when OPEN is empty. (OW-012)
python3 - <<'PY'
import json, os, re, sys
path = ".claude/master/FOUNDER_QUESTIONS.md"
if not os.path.exists(path):
    sys.exit(0)
text = open(path, encoding="utf-8").read()
# the "## OPEN ..." section, up to the next "## " heading or end of file
m = re.search(r'^##\s+OPEN\b.*?$(.*?)(?=^##\s|\Z)', text, re.S | re.M)
section = (m.group(1).strip() if m else "")
questions = re.findall(r'^###\s+(Q.*)$', section, re.M)
if not questions:
    sys.exit(0)
n = len(questions)
instr = (
    f"[FOUNDER QUESTIONS] {n} open question(s) await founder direction. "
    "Greet briefly, then RAISE THEM NOW with the founder using AskUserQuestion (one at a time, "
    "with each question's options + your recommendation). Record each answer in the '## ANSWERED' "
    "section of .claude/master/FOUNDER_QUESTIONS.md and move it out of OPEN. If an answer states a "
    "reusable principle, also append a one-line rule to the matching section of "
    ".claude/master/GUIDANCE.md (compounding — so agents stop asking that class).\n\n"
    "OPEN questions:\n" + section
)
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": instr,
}}))
PY
