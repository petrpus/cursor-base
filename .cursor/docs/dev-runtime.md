# Dev runtime (universal pattern)

A lightweight orchestration layer for managing the **local development runtime** of a repository that uses this Cursor kit.

It provides a consistent way to:

- start infrastructure
- start application processes
- monitor logs
- inspect runtime status
- debug problems

The runtime is designed to work well for both **developers and AI agents (Cursor)**.

## Architecture (pattern)

The development runtime is organized into three layers:

1. **Infrastructure** — e.g. database, cache, object storage (started via a script such as `scripts/infra-up.sh` or npm script).
2. **Application processes** — e.g. app server, worker, scheduler, studio (started by scripts under `.cursor/local/bin/`).
3. **Runtime orchestration scripts** — in `.cursor/local/bin/`: `up.sh`, `down.sh`, `restart.sh`, `status.sh`, `monitor.sh`, `logs.sh [service]`.

Typical layout:

- **scripts/** — e.g. `infra-up.sh` for infrastructure only.
- **.cursor/local/bin/** — `up.sh`, `down.sh`, `restart.sh`, `status.sh`, `monitor.sh`, `logs.sh`. A `config.sh` (sourced by other scripts) defines project name, `DEV_ROOT`, log/run dirs, service names and commands, ports.

Runtime state (logs, PIDs) is stored under a configurable root (e.g. `$DEV_ROOT` or `/tmp/<project>-dev/`), with `logs/` and `run/` subdirs.

## Usage (generic)

- **Start:** `bash .cursor/local/bin/up.sh`
- **Stop:** `bash .cursor/local/bin/down.sh`
- **Restart:** `bash .cursor/local/bin/restart.sh`
- **Status:** `bash .cursor/local/bin/status.sh`
- **Monitor logs:** `bash .cursor/local/bin/monitor.sh`
- **Logs for one service:** `bash .cursor/local/bin/logs.sh <service>`

## Project-specific details

Paths, project name, service list, and ports are **project-specific**. They are defined in `.cursor/local/bin/config.sh` and documented in the project’s AI docs.

**For this project’s runtime layout, services, and paths, see docs/ai/dev-runtime.md** (when working in a repo that uses this kit and has adopted docs/ai).

Agents should prefer the scripts above and the project’s doc (e.g. docs/ai/dev-runtime.md) over ad hoc process management.
