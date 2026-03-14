#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

proc_status() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"
  local state="down"
  local pid="-"

  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file" || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      state="up"
    else
      state="stale"
    fi
  fi

  printf "%-12s %-8s %s\n" "$name" "$state" "$pid"
}

port_status() {
  local label="$1"
  local port="$2"

  if ss -ltn "( sport = :$port )" | grep -q LISTEN; then
    echo "$label:$port up"
  else
    echo "$label:$port down"
  fi
}

echo "PROCESSES"
echo "-----------------------------"
proc_status "$APP_NAME"
proc_status "$WORKER_NAME"
proc_status "$SCHEDULER_NAME"
proc_status "$STUDIO_NAME"

echo
echo "PORTS"
echo "-----------------------------"
port_status "postgres" "$POSTGRES_PORT"
port_status "redis" "$REDIS_PORT"
port_status "minio-api" "$MINIO_API_PORT"
port_status "minio-console" "$MINIO_CONSOLE_PORT"
port_status "app" "$APP_PORT"
port_status "studio" "$STUDIO_PORT"

echo
echo "LOGS"
echo "-----------------------------"
echo "$LOG_DIR"
