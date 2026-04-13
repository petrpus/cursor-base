# Pre-commit: verify, docs, and commit

Run this command to verify changes, update documentation, and prepare/apply clean commit(s) based on execution mode.

## What you will do

1. **Verify and fix (change-verifier + testing-agent)**
   - Call the **change-verifier** subagent with a prompt to run a **full check** on the current working tree (all modified/added files, lint, types, tests).
   - Ensure the verifier’s findings are fully addressed: fix any reported issues in the codebase.
   - If tests need attention (failures, gaps, or flakiness), call the **testing-agent** with a prompt to fix or add tests so the test suite is **green**.
   - Repeat or refine until the full check passes and all tests are green.

2. **Documentation review (docs-agent)**
   - Call the **docs-agent** subagent with a prompt to **review and update documentation** so it reflects **all changes made since the last commit** (e.g. new features, API changes, config, scripts). Include:
     - In-repo docs (e.g. `.cursor/docs/`, README, or other project docs).
     - Comments and docstrings where they affect understanding of the recent changes.
   - Apply any doc edits the docs-agent recommends (or that you agree with) so the docs are accurate and complete.

3. **Prepare commit boundaries and messages**
   - Inspect all changes (verification fixes, doc updates, and original edits).
   - If changes fall into **logically or functionally separate** groups, propose **multiple commits** (e.g. one for feature/fix, one for docs, one for tests). Otherwise propose a single commit.
   - Use the **commit-agent** subagent to propose **commit boundaries and messages**.
   - If the commit-agent is not used, propose clear, conventional commit messages yourself.

4. **Apply commits only when mode allows**
   - **Interactive mode (default):** do not run `git add`/`git commit`; present proposed commit plan for user approval and application.
   - **Autonomous cloud mode with explicit environment policy requiring commit/push:** apply staging/commit/push according to that policy.

## Execution rules

- Run steps in order: (1) verify and green tests → (2) docs → (3) commit planning → (4) apply only when allowed by mode/policy.
- Do not skip the change-verifier or the docs review; only proceed to commit planning once verification passes and docs are updated.
- Prefer using the subagents (change-verifier, testing-agent, docs-agent, commit-agent) via the task tool with concrete prompts; invoke testing-agent when test-related work is needed.
- Keep the command self-contained: the agent should not ask for extra confirmation unless something is ambiguous or risky (e.g. force-push or destructive git operations).
