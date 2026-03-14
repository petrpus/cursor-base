#!/usr/bin/env bash
set -euo pipefail

mkdir -p .cursor/local/logs
printf '%s	%s
' "$(date -Iseconds)" "task_start" >> .cursor/local/logs/workflow.tsv
