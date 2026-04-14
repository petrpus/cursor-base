# Testing Triggers

Policy note: this guidance is enforced via `.cursor/rules/testing/testing-triggers.mdc`.

Use `testing-agent` for any task that changes behavior, fixes a bug, adds a feature, changes a form, changes a route, or affects database logic.

## Required outcomes
- identify the minimum required test coverage
- add or propose unit, integration, or e2e tests as appropriate
- call out untested risk explicitly if tests cannot be added

Do not treat implementation as complete merely because the code compiles.
