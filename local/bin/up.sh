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

start_proc() {
  local name="$1"
  local cmd="$2"
  local log_file="$LOG_DIR/${name}.log"
  local pid_file="$RUN_DIR/${name}.pid"

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

echo "==> Starting infra"
bash -lc "$INFRA_UP_CMD" >>"$LOG_DIR/infra.log" 2>&1

echo "==> Starting app processes"
start_proc "$APP_NAME" "$APP_CMD"
start_proc "$WORKER_NAME" "$WORKER_CMD"
start_proc "$SCHEDULER_NAME" "$SCHEDULER_CMD"
start_proc "$STUDIO_NAME" "$STUDIO_CMD"

echo
echo "Runtime root: $DEV_ROOT"
echo "Logs: $LOG_DIR"
echo
bash "$BIN_DIR/status.sh"
