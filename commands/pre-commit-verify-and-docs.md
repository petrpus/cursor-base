# Pre-commit: verify, docs, and commit

Run this command to verify changes, update documentation, and create clean commit(s).

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

3. **Stage and commit**
   - Stage **all** changes (verification fixes, doc updates, and original edits).
   - If changes fall into **logically or functionally separate** groups, create **multiple commits** (e.g. one for feature/fix, one for docs, one for tests). Otherwise a single commit is fine.
   - Use the **commit-agent** subagent to propose **commit boundaries and messages** based on the staged changes, then create the commit(s) accordingly (amend or split if the agent suggests it).
   - If the commit-agent is not used, write clear, conventional commit messages yourself.

## Execution rules

- Run steps in order: (1) verify and green tests → (2) docs → (3) stage and commit.
- Do not skip the change-verifier or the docs review; only proceed to commit once verification passes and docs are updated.
- Prefer using the subagents (change-verifier, testing-agent, docs-agent, commit-agent) via the task tool with concrete prompts; invoke testing-agent when test-related work is needed.
- Keep the command self-contained: the agent should not ask for extra confirmation unless something is ambiguous or risky (e.g. force-push or destructive git operations).
