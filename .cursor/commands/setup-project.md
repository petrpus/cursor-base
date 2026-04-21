# /setup-project

Bootstrap a **new consumer repository** with the full cursor-base toolkit in one orchestrated run. Chains the standard adoption sequence and surfaces gaps without losing the user in individual command docs.

Use this once per new repo. After this command succeeds, the repo is ready for agent-assisted development.

## Prerequisites

- `cursor-kit` is available on `$PATH` (`npm i -g cursor-kit` or `npx cursor-kit`).
- The user has provided (or you can infer) the `cursor-base` source: a local path, a `CURSOR_BASE_DIR` env var, or a GitHub repo slug.

## Required workflow

### Step 1 — Init managed kit

Run in the terminal (use the tool — do not simulate):

```bash
cursor-kit init --project . [--shared <path> | --repo <owner/repo>] [--include-local]
```

If `--shared` / `--repo` are unknown, ask the user once before proceeding.

Report the result table from cursor-kit (managed roots, file counts, any errors).

**Gate:** if `cursor-kit init` exits non-zero, stop and surface the error. Do not continue.

### Step 2 — Doctor

```bash
cursor-kit doctor --project .
```

Surface any warnings or errors. Minor warnings (missing optional files) are acceptable. Any error exits → stop and fix before proceeding.

### Step 3 — Adopt repo docs

Invoke **`/adopt-repo-docs`** workflow:
- Delegate to **`docs-agent`** to discover the repo and write `docs/ai/` pages.
- Required output: `docs/ai/README.md`, `docs/ai/AGENT_ADOPTION.md`, `docs/ai/stack.md`, `docs/ai/testing.md`, `AGENTS.md` (root).
- See `.cursor/commands/adopt-repo-docs.md` for the full required workflow; execute it fully.

### Step 4 — Adopt dev environment

Invoke **`/adopt-dev-env`** workflow:
- Delegate to **`devops-agent`** to infer the runtime environment and write `config.sh` and `docs/ai/dev-runtime.md`.
- If a migration tool is detected, generate the DB command files.
- See `.cursor/commands/adopt-dev-env.md` for the full required workflow; execute it fully.

### Step 5 — Adopt design system (conditional)

Check if the repo has a frontend stack (React, Vue, Svelte, Angular, or similar) in its `package.json` or source layout.

- **If yes:** invoke **`/adopt-design-system`** workflow. See `.cursor/commands/adopt-design-system.md`.
- **If no:** skip and note in the output that this step was skipped.

### Step 6 — Final verification

```bash
cursor-kit doctor --project .
cursor-kit audit --project .
```

Report exit codes and any remaining issues.

### Step 7 — Summary

Print a structured onboarding report:

```
## Setup complete

| Step | Status | Notes |
|------|--------|-------|
| cursor-kit init | ✓ / ✗ | |
| cursor-kit doctor | ✓ / warn / ✗ | |
| /adopt-repo-docs | ✓ | files created |
| /adopt-dev-env | ✓ | config.sh written |
| /adopt-design-system | ✓ / skipped | |
| Final doctor | ✓ / warn | |
| Final audit | ✓ / warn / ✗ | |

## Recommended next steps
- [ ] Fill in any TODO sections in docs/ai/
- [ ] Set up .env from .env.example
- [ ] Run /dev-up to start local dev environment
- [ ] Run /ship before your first real commit
```

## Guard rules

- Do not skip Step 1 (`cursor-kit init`) — all other steps depend on the managed kit being in place.
- Do not invent values for `--shared` or `--repo`. Ask if unknown.
- Each step that modifies files must complete before the next step starts (sequential, not parallel).
- If any step fails, stop and surface the error with a clear remediation path. Do not silently continue.
