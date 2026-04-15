# .cursor/docs — Universal kit documentation only

This directory contains **universal** documentation for the Cursor kit: how the kit works, how to use it, and generic policies. It must **not** contain project-specific content (e.g. this repo’s UI stack, design system, runtime paths, or product names).

## Separation

- **.cursor/docs** — Universal only: agent topology, dev-runtime *pattern*, tooling policy, installation notes, UI agent integration overview.
- **docs/ai** — Project-specific AI entry point: overview, architecture map, domain map, workflow, **and** this project’s UI stack, design system, UI patterns, and local runtime details (see docs/ai/dev-runtime.md, ui-stack.md, design-system.md, ui-patterns.md).
- **docs/** — Deep project documentation.

Project-specific UI and runtime docs live in **docs/ai** so that `.cursor` can remain a **portable shared kit** (typically **hard-copied** into app repos via **`cursor-kit init`**). Rules and agents that need the project’s design system or runtime layout reference **docs/ai**, not `.cursor/docs`.

## Files in this directory (universal only)

| File | Purpose |
|------|--------|
| **README.md** | This file — scope of .cursor/docs. |
| **agent-topology.md** | How the built-in Agent and subagents work; reliability levers; list of subagents. |
| **dev-runtime.md** | Universal dev runtime *pattern* (scripts, layers, usage). Project-specific paths and services → docs/ai/dev-runtime.md. |
| **tooling-policy.md** | Evidence priority and modification policy for UI-focused agents (generic). |
| **installation-notes.md** | How to install or replace the kit; verify hooks; delegation-friendly prompts. |
| **README-ui-agent-integration.md** | UI subagents, commands, rules; recommended first run (generic). |
| **cursor-kit-adoption.md** | How to adopt the split `.cursor` layout using the `cursor-kit` CLI (hard-copied shared subtrees + local config). |

Slash command **`/adopt-repo-docs`** (see `.cursor/commands/adopt-repo-docs.md`) bootstraps **`docs/ai/`** and **`AGENTS.md`** in **consumer** repos after **`cursor-kit init`**. UI-specific follow-up: **`/adopt-design-system`**.

Slash command **`/adopt-cloud-env`** (see `.cursor/commands/adopt-cloud-env.md`) is **optional** and **separate** from **`/adopt-repo-docs`**: it drafts **`.cursor/environment.json`** for **Cursor Cloud agents** with **safe hardcoded `env` values only**, and lists **Cursor Secrets** the user must configure for passwords and full URLs. Skip if you do not use Cloud agents.

Previously project-specific content (ui-stack, design-system, ui-patterns, and full dev-runtime details) typically lives in **docs/ai** in **consumer application repositories** that adopt this kit. This `cursor-base` checkout may not include a full `docs/ai/` tree; when absent, treat `.cursor/docs/` plus any repo-local `docs/dev/` notes as the operational docs for the toolkit itself.
