#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

mkdir -p "$LOG_DIR" "$RUN_DIR"

touch \
  "$LOG_DIR/infra.log" \
  "$LOG_DIR/app.log" \
  "$LOG_DIR/worker.log" \
  "$LOG_DIR/scheduler.log" \
  "$LOG_DIR/studio.log"

print_status() {
  clear
  echo "=== DEV RUNTIME MONITOR ==="
  echo "time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  bash "$BIN_DIR/status.sh"
  echo
  echo "==========================="
  echo "Live logs below (Ctrl+C to stop monitor)"
  echo
}

print_status

(
  while true; do
    sleep 5
    print_status
  done
) &

STATUS_PID=$!

cleanup() {
  kill "$STATUS_PID" 2>/dev/null || true
}
trap cleanup EXIT

tail -n 50 -F \
  "$LOG_DIR/infra.log" \
  "$LOG_DIR/app.log" \
  "$LOG_DIR/worker.log" \
  "$LOG_DIR/scheduler.log" \
  "$LOG_DIR/studio.log" 2>/dev/null \
| awk '
  BEGIN {
    current = ""
  }
  /^==> / {
    current = $0
    sub(/^==> /, "", current)
    sub(/ <==$/, "", current)
    next
  }
  {
    if (current != "") {
      printf("[%s] %s\n", current, $0)
      fflush()
    }
  }
'
