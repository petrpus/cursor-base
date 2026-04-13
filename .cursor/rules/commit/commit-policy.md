# Commit Policy

Commit behavior is mode-dependent and must follow policy precedence.

## Interactive mode (default)

In normal interactive use, the agent should **prepare** commits (proposed boundaries/messages) and wait for explicit user approval before applying git operations.

## Autonomous cloud mode

When the runtime explicitly requires autonomous delivery (for example cloud-task environments that require commit/push), the agent may stage/commit/push according to that runtime policy.

## Universal requirements

- Always consult `commit-agent` before recommending final commit boundaries for non-trivial tasks.
- Commit recommendations must:
  - follow verification,
  - avoid mixed concerns when practical,
  - describe true scope,
  - separate refactor-only work from behavior changes when practical.
- If a command/rule conflict appears, follow `.cursor/rules/01-policy-precedence.mdc` and record the conflict in the closeout summary.
