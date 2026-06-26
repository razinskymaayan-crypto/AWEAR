#!/bin/bash
# Telegram report helper for the AWEAR autopilot.
# Sends text / photo / document to the "Awear Alerts" group.
# Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from the environment (set by the workflow).
#
# Usage:
#   bash scripts/tg.sh text  "your message"
#   bash scripts/tg.sh photo /tmp/shot.png   "caption"
#   bash scripts/tg.sh doc   docs/research/x.md "caption"
set -u

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT="${TELEGRAM_CHAT_ID:-}"
[ -z "$TOKEN" ] || [ -z "$CHAT" ] && { echo "tg.sh: telegram env not set — skipping"; exit 0; }

API="https://api.telegram.org/bot${TOKEN}"
MODE="${1:-text}"

case "$MODE" in
  text)
    curl -s -X POST "$API/sendMessage" --data-urlencode chat_id="$CHAT" \
         --data-urlencode text="${2:-}" >/dev/null && echo "tg: text sent" ;;
  photo)
    [ -f "${2:-}" ] || { echo "tg: photo not found: ${2:-}"; exit 0; }
    curl -s -X POST "$API/sendPhoto" -F chat_id="$CHAT" \
         -F photo=@"$2" -F caption="${3:-}" >/dev/null && echo "tg: photo sent" ;;
  doc)
    [ -f "${2:-}" ] || { echo "tg: doc not found: ${2:-}"; exit 0; }
    curl -s -X POST "$API/sendDocument" -F chat_id="$CHAT" \
         -F document=@"$2" -F caption="${3:-}" >/dev/null && echo "tg: doc sent" ;;
  *) echo "tg.sh: unknown mode '$MODE' (use text|photo|doc)"; exit 0 ;;
esac
