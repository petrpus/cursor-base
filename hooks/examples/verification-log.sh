#!/usr/bin/env bash
set -euo pipefail

VERDICT="${1:-unknown}"
mkdir -p .cursor/local/logs
printf '%s	verifier	%s
' "$(date -Iseconds)" "$VERDICT" >> .cursor/local/logs/workflow.tsv
