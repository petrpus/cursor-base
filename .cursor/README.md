# Cursor Workspace Kit

This `.cursor/` directory is designed to be replaced as a whole. It is **shared AI tooling**; project-specific knowledge lives in **docs/ai** (see `.cursor/context/project-docs-contract.md`).

## What this setup optimizes for
- **L1–L4** risk-tiered routing (see `rules/orchestration/risk-tiering.mdc`, `main-orchestration.mdc`); path **glob** rules in `rules/**` for specialist context
- specialist reference table: `.cursor/docs/orchestration-routing.md`
- **L2+** plan-review pass (at least one specialist) before implementation; **session budget** hard stops in `main-orchestration`
- custom subagents in `.cursor/agents/`
- verifier-first delivery; clean commit discipline
- local runtime and logging in `.cursor/local/bin/`; session JSONL in `tmp/chat-logs/`
- repo adoption via **docs/ai** (see `project-docs-contract.md`)
- model-tier policy in `context/model-governance.md` (L3 **economy** for optional cost control)
- skills/playbooks in `.cursor/skills/`

## Official Cursor alignment
Cursor discovers custom subagents from `.cursor/agents/`. The built-in Agent remains the primary assistant and delegates to these custom subagents when prompted by rules, commands, and task shape. See Cursor docs on subagents, rules, hooks, and skills.

## Git and commits

Always delegate to **`commit-agent`** before any git operation that mutates repository state or history (staging strategy, `commit`, `commit --amend`, `rebase`, `merge`, `cherry-pick`, `reset` that moves `HEAD`, `push`). Read-only commands (`status`, `diff`, `log`, `show`, `branch` listing) are exempt. Details: `.cursor/rules/commit/commit-policy.md`. Invoke **`commit-agent`** via the **`/commit-agent`** command (`.cursor/commands/commit-agent.md`) or your editor's subagent / task delegation; see `.cursor/agents/commit-agent.md`.

## Replacement policy
This directory is intended to replace the previous `.cursor/` directory wholesale.
Local-only helper scripts under `.cursor/local/` are gitignored by design.
