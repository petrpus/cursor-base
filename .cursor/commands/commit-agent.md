# /commit-agent

Delegate to the **`commit-agent`** subagent before any mutating git operation or before presenting a commit/staging plan.

## Required workflow

1. Ensure verification required by policy is complete (for example `change-verifier` when applicable).
2. Call **`commit-agent`** with the current diff scope, intent, and runtime mode (interactive prepare-only vs autonomous allowed writes).
3. Apply mutating git only per the returned plan (boundaries, messages, staging strategy).

## Policy

See `.cursor/rules/commit/commit-policy.md` and `.cursor/agents/commit-agent.md`.
