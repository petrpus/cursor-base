---
name: regression-surface-check-skill
description: Identify which existing tests are at risk of regression from this change.
skill_level: 2
invoke: inline
domain: testing
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: enumerated
---

# Regression Surface Check Skill

**Question:** Which existing tests cover behavior that this change may have affected — and should be run (or reviewed for adequacy) before considering the change safe?

**Trigger:** Any change that modifies existing functions, modules, database queries, or shared utilities.

## Checks

1. Identify all functions/modules modified. Map each to its test file(s) by naming convention (`*.test.ts`, `*.spec.ts`, or `__tests__/`).
2. For shared utilities modified (e.g. auth helpers, formatting, validation): find all modules that import them — their tests are also at risk.
3. For database schema/query changes: identify tests that test related data shapes or use the affected table.
4. For API contract changes: identify API integration tests and client-side tests that assert on the changed shape.
5. For config/env changes: identify tests that exercise environment-dependent behavior.
6. If no tests exist for the modified behavior, output `FAIL(no-coverage)`.

## Output

- **PASS** — regression surface is bounded and tests exist for all modified behavior.
- **FAIL(no-coverage)** — modified behavior has no test coverage; list the uncovered functions/modules.
- **WARN(wide-surface)** — shared utility modified; list downstream modules that depend on it and may be affected.
- **WARN(integration-only)** — only integration tests cover the change; no unit-level test for the core logic.

Pass the identified test list to `testing-agent` or `change-verifier` as the minimum test set to run.

## On FAIL / WARN

Escalate to `testing-agent` with: the identified at-risk tests, the FAIL/WARN codes, and the modified module list.

## Telemetry tags
- `skill_name:regression-surface-check`
- `skill_level:2`
- `domain:testing`
