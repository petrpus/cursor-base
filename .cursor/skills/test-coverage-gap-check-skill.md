---
name: test-coverage-gap-check-skill
description: Identify new code branches or behaviors that lack test coverage.
skill_level: 2
invoke: inline
domain: testing
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: enumerated
---

# Test Coverage Gap Check Skill

**Question:** Which new code branches, conditional paths, or behaviors introduced in this change have no corresponding test?

**Trigger:** Any change that adds new functions, conditional logic, error paths, or user-visible behaviors.

## Checks

1. Every new function with branching logic (if/else, switch, early return) has at least one test per meaningful branch.
2. The happy path of new API endpoints has an integration test.
3. New error/validation paths have tests that assert the error response — not just the success path.
4. New async operations have at least one test covering the failure case (rejected promise, timeout, 5xx).
5. New domain rules or business logic are covered by unit tests isolated from I/O.
6. Deleted tests are justified — they were not the only coverage for the deleted behavior.

## Output

- **PASS** — all new branches have test coverage.
- **FAIL(untested-branch)** — conditional logic branch has no test; list the specific branches.
- **FAIL(untested-error-path)** — error/validation path not tested; list the paths.
- **FAIL(untested-async-failure)** — async failure case not covered; list the operations.
- **FAIL(untested-domain-rule)** — business rule added without unit test; list the rules.
- **WARN(test-deleted)** — tests were removed; confirm deleted behavior is intentional.

## On FAIL

Escalate to `testing-agent` with: the specific untested paths identified, the FAIL codes, and which file contains the new logic.

## Telemetry tags
- `skill_name:test-coverage-gap-check`
- `skill_level:2`
- `domain:testing`
