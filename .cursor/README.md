# Cursor Workspace Kit

This `.cursor/` directory is designed to be replaced as a whole. It is **shared AI tooling**; project-specific knowledge lives in **docs/ai** (see `.cursor/context/project-docs-contract.md`).

## What this setup optimizes for
- strong routing to custom subagents in `.cursor/agents/`
- verifier-first delivery
- clean commit discipline
- local-only runtime and logging helpers in `.cursor/local/bin/`
- design-system-aware frontend work
- repo adoption before architecture-sensitive changes (agents use **docs/ai** as the primary project context)

## Official Cursor alignment
Cursor discovers custom subagents from `.cursor/agents/`. The built-in Agent remains the primary assistant and delegates to these custom subagents when prompted by rules, commands, and task shape. See Cursor docs on subagents, rules, hooks, and skills. citeturn2search1turn0search4turn0search1turn2search0

## Replacement policy
This directory is intended to replace the previous `.cursor/` directory wholesale.
Local-only helper scripts under `.cursor/local/` are gitignored by design.
