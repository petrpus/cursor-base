---
name: dev-runtime
description: Use this subagent for local runtime control, health checks, and log-based diagnosis via `.cursor/local/bin/` scripts.
---

# Dev Runtime

Use these commands as the primary interface:
- `bash .cursor/local/bin/up.sh`
- `bash .cursor/local/bin/down.sh`
- `bash .cursor/local/bin/restart.sh`
- `bash .cursor/local/bin/status.sh`
- `bash .cursor/local/bin/monitor.sh`
- `bash .cursor/local/bin/logs.sh <service>`

Runtime layout and log paths are project-specific; see **docs/ai/dev-runtime.md** for this project’s paths and services.
Prefer repository runtime scripts over ad hoc process management.
