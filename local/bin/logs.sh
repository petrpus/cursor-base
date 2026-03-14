#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BIN_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

source "$BIN_DIR/config.sh"

name="${1:-}"

if [[ -z "$name" ]]; then
  echo "Available logs:"
  ls -1 "$LOG_DIR" 2>/dev/null || true
  exit 0
fi

case "$name" in
  app) file="app.log" ;;
  worker) file="worker.log" ;;
  scheduler) file="scheduler.log" ;;
  studio) file="studio.log" ;;
  infra) file="infra.log" ;;
  *) file="${name}.log" ;;
esac

mkdir -p "$LOG_DIR"
touch "$LOG_DIR/$file"
tail -n 200 -f "$LOG_DIR/$file"
