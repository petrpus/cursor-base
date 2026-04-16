# Commit Policy

Commit behavior is mode-dependent and must follow policy precedence.

## Interactive mode (default)

In normal interactive use, the agent should **prepare** commits (proposed boundaries/messages) and wait for explicit user approval before applying git operations.

## Autonomous cloud mode

When the runtime explicitly requires autonomous delivery (for example cloud-task environments that require commit/push), the agent may stage/commit/push according to that runtime policy.

## Universal requirements

- Always delegate to **`commit-agent`** before **any** git operation that mutates repository state or history. That includes staging strategy, `commit`, `commit --amend`, `rebase`, `merge`, `cherry-pick`, `reset` that moves `HEAD`, and `push`. Read-only commands (`status`, `diff`, `log`, `show`, `branch` listing) do not require `commit-agent`.
- Execute mutating git commands only per the `commit-agent` plan (boundaries, messages, and prepare-only vs allowed writes for this runtime).
- Commit recommendations must:
  - follow verification,
  - avoid mixed concerns when practical,
  - describe true scope,
  - separate refactor-only work from behavior changes when practical.
- If a command/rule conflict appears, follow `.cursor/rules/01-policy-precedence.mdc` and record the conflict in the closeout summary.
