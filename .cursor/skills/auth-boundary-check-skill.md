---
name: auth-boundary-check-skill
description: Check whether new or modified routes/functions are properly auth-gated.
skill_level: 2
invoke: inline
domain: security
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Auth Boundary Check Skill

**Question:** Are all new or modified entry points (routes, endpoints, resolvers, server actions) protected by the required authentication and authorization checks?

**Trigger:** Any change that adds or modifies a route, endpoint, server action, RPC method, or function that accepts external input.

## Checks

1. Every new route/endpoint has an auth guard, middleware, or decorator — not just documentation.
2. Protected resources are not reachable via an unauthenticated alternate path (e.g. public alias, missing route guard on nested path).
3. Role/permission requirements match the data sensitivity (admin-only data is behind admin check, not just "any authenticated user").
4. Session/token validation happens before any data read or mutation — not after.
5. If auth is intentionally skipped (public endpoint), this is explicitly asserted in the code (comment or typed annotation).

## Output

- **PASS** — all entry points are auth-gated appropriately or are explicitly public.
- **FAIL(unguarded-route)** — one or more routes are reachable without auth; escalate to `security-agent`.
- **FAIL(insufficient-authz)** — route is authenticated but not authorized for the required role; escalate to `security-agent`.
- **FAIL(late-check)** — auth happens after data access; escalate to `security-agent`.
- **N/A** — change does not add or modify any external-facing entry points.

## On FAIL

Delegate to `security-agent` with: affected route paths, the current guard code, and the FAIL code from above.

## Telemetry tags
- `skill_name:auth-boundary-check`
- `skill_level:2`
- `domain:security`
