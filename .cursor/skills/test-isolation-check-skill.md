---
name: test-isolation-check-skill
description: Check whether new tests are isolated — no shared mutable state, proper cleanup, and mocks at the right boundary.
skill_level: 2
invoke: inline
domain: testing
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Test Isolation Check Skill

**Question:** Are new tests isolated from each other and from external state — no shared mutable variables, proper teardown, and mocks at appropriate system boundaries?

**Trigger:** Any change that adds or modifies test files.

## Checks

1. Tests do not share mutable state through module-level variables that are mutated mid-test without reset.
2. Database tests use transactions that roll back, or a dedicated test database that is truncated before each test — not the dev database.
3. Mocks are scoped to the test (e.g. `vi.mock`/`jest.mock` with `beforeEach` setup and `afterEach` restore) — not leaking between tests via module cache.
4. External HTTP calls are intercepted (e.g. `msw`, `nock`) or the tested function is called with an injected HTTP client — not making real network requests in unit/integration tests.
5. Tests clean up created resources (files, DB rows, queue entries) in `afterEach`/`afterAll`.
6. Test order does not matter — tests pass regardless of execution order.

## Output

- **PASS** — tests are properly isolated with appropriate boundaries and cleanup.
- **FAIL(shared-state)** — mutable shared state not reset between tests; escalate to `testing-agent`.
- **FAIL(real-db-in-unit-test)** — unit test hits real database; escalate to `testing-agent`.
- **FAIL(leaking-mock)** — mock leaks between test files via module cache; escalate to `testing-agent`.
- **FAIL(real-network-call)** — test makes unintercepted external HTTP call; escalate to `testing-agent`.
- **FAIL(missing-cleanup)** — test creates resources without teardown; escalate to `testing-agent`.
- **N/A** — change does not add or modify test files.

## On FAIL

Delegate to `testing-agent` with: the specific test file, FAIL code, and the isolation violation described.

## Telemetry tags
- `skill_name:test-isolation-check`
- `skill_level:2`
- `domain:testing`
