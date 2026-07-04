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
# Strip stray CR/LF/whitespace — a trailing newline in the env var makes the
# request URL malformed and curl exits 3 (every report silently fails). See FAILURES.
TOKEN="$(printf '%s' "$TOKEN" | tr -d '[:space:]')"
CHAT="$(printf '%s' "$CHAT" | tr -d '[:space:]')"
[ -z "$TOKEN" ] || [ -z "$CHAT" ] && { echo "tg.sh: telegram env not set — skipping"; exit 0; }

API="https://api.telegram.org/bot${TOKEN}"
MODE="${1:-text}"

# send <method> <curl args...> — retry up to 3x with backoff, and SURFACE failures instead of
# swallowing them (>/dev/null used to hide every 4xx/timeout — reports silently vanished).
send() {
  local method="$1"; shift
  local attempt resp
  for attempt in 1 2 3; do
    resp=$(curl -s --max-time 30 -X POST "$API/$method" "$@" || true)
    if printf '%s' "$resp" | grep -q '"ok":true'; then
      echo "tg: $method sent"
      return 0
    fi
    echo "tg: $method attempt $attempt failed: $(printf '%s' "$resp" | head -c 200)" >&2
    sleep $((attempt * 3))
  done
  echo "tg: $method FAILED after 3 attempts" >&2
  return 1
}

case "$MODE" in
  text)
    send sendMessage --data-urlencode chat_id="$CHAT" --data-urlencode text="${2:-}" ;;
  photo)
    [ -f "${2:-}" ] || { echo "tg: photo not found: ${2:-}"; exit 0; }
    send sendPhoto -F chat_id="$CHAT" -F photo=@"$2" -F caption="${3:-}" ;;
  doc)
    [ -f "${2:-}" ] || { echo "tg: doc not found: ${2:-}"; exit 0; }
    send sendDocument -F chat_id="$CHAT" -F document=@"$2" -F caption="${3:-}" ;;
  *) echo "tg.sh: unknown mode '$MODE' (use text|photo|doc)"; exit 0 ;;
esac
