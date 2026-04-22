# /adopt-repo-docs

Bootstrap or refresh **project-local** documentation so agents can adopt this repository: **`docs/ai/`**, root **`AGENTS.md`**, and optional product/design notes. Use after **`cursor-kit init`** and a clean **`cursor-kit doctor`** (filesystem layout must already be correct).

This command is **not** a substitute for `cursor-kit`: it does not copy the shared kit or manage `.cursor/.cursor-kit-managed.json`.

## Prerequisites

1. **Split layout in place:** `project/.cursor/` is a real directory; shared kit is installed with **`cursor-kit init`** per `docs/dev/cursor-kit.md` in the **cursor-base** checkout (or the portable `.cursor/docs/cursor-kit-adoption.md` when copied into your project).
2. **Mandatory reads for the agent** (before writing):
   - `.cursor/context/repo-adoption-instruction.md`
   - `.cursor/context/project-docs-contract.md`
3. **Orchestration:** for **L2+** adoption gaps, plan first and delegate to specialists (see `.cursor/rules/orchestration/main-orchestration.mdc`).

## Required workflow

1. Use **`docs-agent`** as the primary owner for creating and interlinking `docs/ai` pages.
2. **Discover** the repo (read-only inspection):
   - `package.json` — `name`, `private`, `scripts` keys, `dependencies` / `devDependencies` **names** (not versions); note workspace tools if `pnpm-workspace.yaml` / `package.json` workspaces exist.
   - Obvious stack markers when present (examples): `tsconfig.json`, `vite.config.*`, `next.config.*`, `prisma/schema.prisma`, `docker-compose.yml`, `.github/workflows/*` (high-level only).
   - Python markers: `pyproject.toml`, `requirements.txt`, `Pipfile`, `setup.py`, `manage.py`.
   - Go markers: `go.mod`, `go.sum`.
   - Top-level and `src/` (or `apps/`) layout at a coarse level — enough to describe architecture honestly, not a full static analysis.
3. **Summarize** findings as a short **Repo profile** table or bullet list in the chat response (stack hints, runtime, data store if visible).
4. **Create or update** these files when missing or clearly stale (prefer extending existing good content; never silently delete useful material — see repo-adoption instruction):
   - `docs/ai/README.md` — project overview; links to the rest of `docs/ai`.
   - `docs/ai/AGENT_ADOPTION.md` — how agents should work in this repo; link to contract + entry-point order.
   - `docs/ai/source-of-truth.md` — where canonical deep docs live under `docs/`.
   - `docs/ai/architecture-map.md` — systems and boundaries (runtime, data, integrations).
   - `docs/ai/workflow.md` — how work flows in this repo (branches, reviews, releases).
   - `docs/ai/domain-map.md` — domain language and bounded contexts (stub if unknown; mark TODOs).
   - `docs/ai/coding-rules.md` — conventions agents must follow here; include stack-specific type discipline (e.g. avoid `any`, preferred patterns).
   - `docs/ai/dev-runtime.md` — local dev commands, ports, env files (paths specific to **this** repo).
   - **`docs/ai/stack.md`** — project-specific technology stack (see **Stack doc** below).
   - **`docs/ai/testing.md`** — project-specific testing approach (see **Testing doc** below).
   - **`AGENTS.md`** (repo root) — short local policy; must point at `docs/ai/README.md` as primary context.

### Stack doc — `docs/ai/stack.md`

Generate from the discovered stack profile. Include:
- **Runtime** — language version, package manager, build tool.
- **Framework** — web framework, routing library, rendering strategy.
- **Data** — ORM/query builder, database(s), migration tool.
- **Storage** — object storage, CDN if applicable.
- **Jobs / async** — job queue, scheduler, worker setup.
- **Testing** — unit runner, integration approach, e2e tool, coverage tooling.
- **Tooling** — linter, formatter, type checker, CI platform.
- **Type discipline** — strictness settings, conventions agents must follow (e.g. avoid `any`).

Mark any section as `TODO` if not determinable from inspection.

### Testing doc — `docs/ai/testing.md`

Generate from the discovered testing setup. Include:
- **Test runner and framework** — name, version hint, config file location.
- **Test file conventions** — naming, co-location vs `__tests__/`, import aliases.
- **Layers in use** — which of unit / integration / e2e are present and where.
- **Coverage tooling** — provider, thresholds if configured.
- **CI integration** — which workflow step runs tests, any environment requirements.
- **Known gaps** — areas explicitly untested or marked TODO.

5. **Optional — ask the user first** if they want product/design capture:
   - If yes, add or refresh **`docs/DESIGN.md`** (or the single design doc path the team already uses) with goals, non-goals, and links into `docs/ai`.
6. **If the repo has a real UI stack** (React/Vue/etc. in deps and app code), schedule follow-up **`/adopt-design-system`** to fill `docs/ai/design-system.md`, `ui-stack.md`, and `ui-patterns.md` — do not duplicate that command's full workflow here; a single sentence + link is enough.
7. **If the repo has infra files** (`docker-compose.yml`, `Makefile`, `Procfile`, etc.), schedule follow-up **`/adopt-dev-env`** to generate runtime scripts and `docs/ai/dev-runtime.md` — do not duplicate that command's full workflow here.

## Cloud agents (separate command — default skip)

**`/adopt-repo-docs`** is for **`docs/ai/`** and **`AGENTS.md`**. It does **not** include Cursor Cloud agent setup.

- **Do not** mention **`/adopt-cloud-env`** unless the **user explicitly** asks for Cloud agents, `.cursor/environment.json`, or remote dev infra in this session.
- Teams that **do not** use Cloud agents should be able to run **`/adopt-repo-docs`** end-to-end with no obligation to configure cloud tooling.

For Cloud-only setup, users run **`/adopt-cloud-env`** separately (see `.cursor/commands/adopt-cloud-env.md`).

## Output (required)

Report:

- **Files created or updated** (paths).
- **Repo profile** summary (stack / architecture / scripts).
- **Link graph**: how `docs/ai/README.md` connects to other `docs/ai` pages and `docs/`.
- **Follow-ups**: open questions, TODOs left intentionally, and recommended next commands (e.g. `/adopt-design-system`, `/adopt-dev-env`, `/docs-update`). Mention **`/adopt-cloud-env`** only if the user asked for Cloud agent / `environment.json` work in this session.
