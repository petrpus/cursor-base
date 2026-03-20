#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-recommended}"
mkdir -p .cursor/local/logs
printf '%s	commit	%s
' "$(date -Iseconds)" "$STATUS" >> .cursor/local/logs/workflow.tsv
