---
name: privilege-escalation-check-skill
description: Check whether this change expands permissions, bypasses authorization gates, or allows a user to act beyond their role.
skill_level: 2
invoke: inline
domain: security
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Privilege Escalation Check Skill

**Question:** Does this change allow a user to gain access or perform actions beyond their authorized role — either by expanding role assignments, bypassing permission checks, or acting on behalf of other users?

**Trigger:** Any change that modifies role assignment logic, permission checks, admin operations, user-to-resource ownership, or service-to-service trust boundaries.

## Checks

1. Role assignment functions cannot be called by the role being assigned (e.g. a regular user cannot grant themselves admin).
2. Permission checks use the requesting user's identity — not a parameter supplied by the request body that could be spoofed.
3. Resource ownership checks ensure the requesting user owns the resource — horizontal privilege escalation is guarded.
4. Service tokens or machine-to-machine trust cannot be obtained through user-facing endpoints.
5. If a new "admin override" or "superuser" path is added, it requires explicit elevated auth — not just any auth.
6. Elevation audit logging is present for any role change or privilege grant.

## Output

- **PASS** — no privilege escalation risk detected.
- **FAIL(self-elevation)** — a user can grant themselves a higher role; escalate to `security-agent`.
- **FAIL(spoofed-identity)** — permission check uses caller-supplied identity; escalate to `security-agent`.
- **FAIL(horizontal-escalation)** — a user can act on another user's resources; escalate to `security-agent`.
- **FAIL(unlogged-elevation)** — privilege change lacks audit log; escalate to `security-agent`.
- **N/A** — change does not touch roles, permissions, or user-to-resource ownership.

## On FAIL

Delegate to `security-agent` with: the specific code path, the escalation vector, and the FAIL code.

## Telemetry tags
- `skill_name:privilege-escalation-check`
- `skill_level:2`
- `domain:security`
