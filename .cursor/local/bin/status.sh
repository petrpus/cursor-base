#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

proc_status() {
  local name="$1"
  local pid_file="$RUN_DIR/${name}.pid"
  local state="down" pid="-"

  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file" || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      state="up"
    else
      state="stale"
    fi
  fi

  printf "%-14s %-8s %s\n" "$name" "$state" "$pid"
}

port_status() {
  local label="$1" port="$2"
  if ss -ltn "( sport = :$port )" | grep -q LISTEN; then
    echo "${label}:${port} up"
  else
    echo "${label}:${port} down"
  fi
}

echo "PROCESSES"
echo "-----------------------------"
for entry in "${PROCESSES[@]}"; do
  proc_status "${entry%%|*}"
done

if [[ ${#PORTS[@]} -gt 0 ]]; then
  echo
  echo "PORTS"
  echo "-----------------------------"
  for entry in "${PORTS[@]}"; do
    port_status "${entry%%|*}" "${entry#*|}"
  done
fi

echo
echo "LOGS"
echo "-----------------------------"
echo "$LOG_DIR"
