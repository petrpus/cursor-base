# Model Governance (Universal Policy)

This file defines universal model-tier policy for repositories using this Cursor kit.

## Goals

- control cost without degrading quality,
- reserve high-capability usage for high-risk tasks,
- keep model escalation explicit and auditable.

## Tier definitions

- **Tier A (fast/low cost):** quick analysis, docs upkeep, routine hygiene.
- **Tier B (balanced):** default for orchestration and implementation.
- **Tier C (high capability):** reserved for high-risk and high-ambiguity tasks.

## Default agent-to-tier mapping

### Tier A defaults

- docs-agent
- log-analyst-agent
- design-token-auditor
- responsive-accessibility-auditor
- dev-runtime (routine diagnosis)

### Tier B defaults

- orchestrator
- implementation-agent
- refactor-agent
- frontend-architecture-agent
- design-system-agent
- component-architect

### Tier C defaults (or conditional escalation)

- security-agent for L3/L4 work
- domain-agent for domain-critical high-risk logic
- api-contract-agent for breaking/complex contract risk
- database-agent for migrations and performance-sensitive DB changes
- change-verifier for L3/L4 final gate
- compliance-verifier for L4 and policy-sensitive work

## Escalation policy

Use staged escalation:

1. Tier A
2. Tier B if unresolved ambiguity/risk remains
3. Tier C only when lower tiers are insufficient

If escalating, include rationale in closeout:

- what remained unresolved,
- why higher tier is needed,
- expected value from escalation.

## Budget policy

For non-trivial tasks, define soft budget envelope:

- token soft limit,
- cost soft limit,
- latency target.

If exceeded, record:

- exceedance reason,
- mitigation attempted,
- whether scope/risk justified overrun.

## Data handling constraints

- never include secrets or sensitive credentials in prompts,
- minimize sensitive data exposure in delegation payloads,
- follow repository security rules and environment constraints.
