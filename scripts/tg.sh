#!/bin/bash
# Telegram report helper for the AWEAR autopilot — kept for interface stability
# (dozens of callers use `bash scripts/tg.sh text|photo|doc ...`).
# ALL delivery logic lives in scripts/tglib.py (the canonical Telegram layer):
# 4096-char chunking, retries with 429 backoff, markdown fallback, and a failure
# audit log at .claude/telegram_failures.log. Do not add curl calls here.
#
# Usage:
#   bash scripts/tg.sh text  "your message"
#   bash scripts/tg.sh photo /tmp/shot.png   "caption"
#   bash scripts/tg.sh doc   docs/research/x.md "caption"
set -u
exec python3 "$(dirname "$0")/tglib.py" "$@"
