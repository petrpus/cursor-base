# .cursor/docs — Universal kit documentation only

This directory contains **universal** documentation for the Cursor kit: how the kit works, how to use it, and generic policies. It must **not** contain project-specific content (e.g. this repo’s UI stack, design system, runtime paths, or product names).

## Separation

- **.cursor/docs** — Universal only: agent topology, dev-runtime *pattern*, tooling policy, installation notes, UI agent integration overview.
- **docs/ai** — Project-specific AI entry point: overview, architecture map, domain map, workflow, **and** this project’s UI stack, design system, UI patterns, and local runtime details (see docs/ai/dev-runtime.md, ui-stack.md, design-system.md, ui-patterns.md).
- **docs/** — Deep project documentation.

Project-specific UI and runtime docs live in **docs/ai** so that `.cursor` can remain a shared, symlinkable kit. Rules and agents that need the project’s design system or runtime layout reference **docs/ai**, not `.cursor/docs`.

## Files in this directory (universal only)

| File | Purpose |
|------|--------|
| **README.md** | This file — scope of .cursor/docs. |
| **agent-topology.md** | How the built-in Agent and subagents work; reliability levers; list of subagents. |
| **dev-runtime.md** | Universal dev runtime *pattern* (scripts, layers, usage). Project-specific paths and services → docs/ai/dev-runtime.md. |
| **tooling-policy.md** | Evidence priority and modification policy for UI-focused agents (generic). |
| **installation-notes.md** | How to install or replace the kit; verify hooks; delegation-friendly prompts. |
| **README-ui-agent-integration.md** | UI subagents, commands, rules; recommended first run (generic). |

Previously project-specific content (ui-stack, design-system, ui-patterns, and this project’s full dev-runtime details) has been moved to **docs/ai**. The long “dev team audit” for this project lives in **docs/CURSOR_DEV_TEAM_AUDIT.md**.
