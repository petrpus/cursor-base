# Cursor Workspace Kit

This `.cursor/` directory is designed to be replaced as a whole. It is **shared AI tooling**; project-specific knowledge lives in **docs/ai** (see `.cursor/context/project-docs-contract.md`).

## What this setup optimizes for
- strong routing to custom subagents in `.cursor/agents/`
- verifier-first delivery
- clean commit discipline
- local-only runtime and logging helpers in `.cursor/local/bin/`
- design-system-aware frontend work
- repo adoption before architecture-sensitive changes (agents use **docs/ai** as the primary project context)
- risk-tiered governance and delegation transparency
- model-tier and budget-aware delegation
- reusable skills/playbooks for deterministic specialist workflows

## Official Cursor alignment
Cursor discovers custom subagents from `.cursor/agents/`. The built-in Agent remains the primary assistant and delegates to these custom subagents when prompted by rules, commands, and task shape. See Cursor docs on subagents, rules, hooks, and skills.

## Git and commits

Always delegate to **`commit-agent`** before any git operation that mutates repository state or history (staging strategy, `commit`, `commit --amend`, `rebase`, `merge`, `cherry-pick`, `reset` that moves `HEAD`, `push`). Read-only commands (`status`, `diff`, `log`, `show`, `branch` listing) are exempt. Details: `.cursor/rules/commit/commit-policy.md`. Invoke **`commit-agent`** via the **`/commit-agent`** command (`.cursor/commands/commit-agent.md`) or your editor's subagent / task delegation; see `.cursor/agents/commit-agent.md`.

## Replacement policy
This directory is intended to replace the previous `.cursor/` directory wholesale.
Local-only helper scripts under `.cursor/local/` are gitignored by design.
