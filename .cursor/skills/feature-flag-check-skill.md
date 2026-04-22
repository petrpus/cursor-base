---
name: feature-flag-check-skill
description: Check whether new feature flags or toggles are documented and have a defined removal condition.
skill_level: 2
invoke: inline
domain: config
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Feature Flag Check Skill

**Question:** Are new feature flags documented with their purpose, default value, and a condition under which they will be removed?

**Trigger:** Any change that introduces a new boolean configuration check, environment-based toggle, or feature flag lookup.

## Checks

1. The flag is documented in `docs/ai/` or a dedicated flags registry — not only referenced inline with no explanation.
2. The flag has a defined default behavior for when it is not set (default ON or default OFF is explicit, not ambiguous).
3. A removal condition or expiry milestone is noted (e.g. "remove after Q3 rollout", "remove when feature is stable in prod").
4. Flags that gate security-sensitive behavior (e.g. auth, rate-limiting, encryption) have a stricter default (off unless explicitly enabled).
5. If the flag reads from env vars, it follows `env-declaration-check-skill` (declared in `.env.example`).

## Output

- **PASS** — flag is documented with default and removal condition.
- **FAIL(undocumented-flag)** — flag exists in code but not in docs; add a brief docs entry.
- **FAIL(ambiguous-default)** — flag behavior when unset is unclear; inline-fix to make default explicit.
- **FAIL(no-removal-plan)** — flag has no defined removal condition; add a TODO with milestone.
- **FAIL(unsafe-security-flag)** — security-gating flag defaults to permissive (ON); escalate to `security-agent`.
- **N/A** — change does not introduce feature flags or toggles.

## On FAIL

Fix `FAIL(undocumented-flag)`, `FAIL(ambiguous-default)`, `FAIL(no-removal-plan)` inline. Delegate `FAIL(unsafe-security-flag)` to `security-agent`.

## Telemetry tags
- `skill_name:feature-flag-check`
- `skill_level:2`
- `domain:config`
