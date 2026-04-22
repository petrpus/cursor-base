---
name: api-breaking-change-check-skill
description: Check whether this change removes, renames, or narrows a public API contract in a way that breaks existing consumers.
skill_level: 2
invoke: inline
domain: api
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: enumerated
---

# API Breaking Change Check Skill

**Question:** Does this change break the existing API contract for any consumer — by removing fields, tightening validation, changing response shapes, or removing endpoints?

**Trigger:** Any change to route definitions, request/response types, DTOs, GraphQL schema, or public SDK interfaces.

## Checks

1. No fields are removed from a response type that existing clients may depend on (additive changes are safe; removals are not).
2. No required request field is added without a backward-compatible default or versioning strategy.
3. No endpoint URL, HTTP method, or route path is changed without a redirect or versioned alias.
4. Validation rules are not tightened on existing fields (e.g. changing a nullable field to required, narrowing an enum, reducing a string length max).
5. GraphQL: no field type change, no removal of a nullable wrapper without a deprecation step, no resolver becoming non-null that was nullable.
6. If a breaking change is intentional, a migration path or API version bump is documented.

## Output

- **PASS** — all changes are additive or have a safe migration path.
- **FAIL(field-removal)** — existing response field removed; escalate to `api-contract-agent`.
- **FAIL(required-field-added)** — new required request field without default; escalate to `api-contract-agent`.
- **FAIL(endpoint-change)** — URL/method changed without redirect; escalate to `api-contract-agent`.
- **FAIL(validation-tightened)** — existing field now has stricter validation; escalate to `api-contract-agent`.
- **WARN(intentional-break)** — breaking change with documented migration path; note for `api-contract-agent` review.
- **N/A** — change does not modify any public API surface.

## On FAIL

Delegate to `api-contract-agent` with: old and new type/schema definitions and the FAIL code.

## Telemetry tags
- `skill_name:api-breaking-change-check`
- `skill_level:2`
- `domain:api`
