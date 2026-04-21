#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

mkdir -p "$LOG_DIR" "$RUN_DIR"
touch "$LOG_DIR/infra.log"

start_proc() {
  local name="$1" cmd="$2"
  local log_file="$LOG_DIR/${name}.log"
  local pid_file="$RUN_DIR/${name}.pid"

  touch "$log_file"

  if [[ -f "$pid_file" ]]; then
    local old_pid
    old_pid="$(cat "$pid_file" || true)"
    if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
      echo "[$name] already running with PID $old_pid"
      return
    else
      rm -f "$pid_file"
    fi
  fi

  (
    echo "[$(date -Iseconds)] starting $name"
    exec bash -lc "$cmd"
  ) >>"$log_file" 2>&1 &

  local pid=$!
  echo "$pid" > "$pid_file"
  echo "[$name] started with PID $pid"
}

if [[ -n "${INFRA_UP_CMD:-}" ]]; then
  echo "==> Starting infra"
  bash -lc "$INFRA_UP_CMD" >>"$LOG_DIR/infra.log" 2>&1
fi

echo "==> Starting app processes"
for entry in "${PROCESSES[@]}"; do
  name="${entry%%|*}"
  cmd="${entry#*|}"
  start_proc "$name" "$cmd"
done

echo
echo "Runtime root: $DEV_ROOT"
echo "Logs: $LOG_DIR"
echo
bash "$BIN_DIR/status.sh"
