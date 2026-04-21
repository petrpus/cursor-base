#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

stop_proc() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "[$name] stopping PID $pid"
      kill "$pid" || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

mkdir -p "$LOG_DIR" "$RUN_DIR"
touch "$LOG_DIR/infra.log"

echo "==> Stopping app processes"
for entry in "${PROCESSES[@]}"; do
  stop_proc "${entry%%|*}"
done

if [[ -n "${INFRA_DOWN_CMD:-}" ]]; then
  echo "==> Stopping infra"
  bash -lc "$INFRA_DOWN_CMD" >>"$LOG_DIR/infra.log" 2>&1 || true
fi

for entry in "${PORTS[@]}"; do
  port="${entry#*|}"
  fuser -k "${port}/tcp" 2>/dev/null || true
done

echo "Done."
