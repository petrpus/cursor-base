# Model Governance (Universal Policy)

This file defines universal model-tier policy for repositories using this Cursor kit.

## Goals

- control cost without degrading quality,
- reserve high-capability usage for high-risk tasks,
- keep model escalation explicit and auditable.

## Tier definitions

- **Tier A (fast/low cost):** quick analysis, docs upkeep, routine hygiene, **L3 economy plan phases** when `risk-tiering` allows.
- **Tier B (balanced):** default for orchestration and implementation.
- **Tier C (high capability):** reserved for high-risk and high-ambiguity implementation and gates.

## Default agent-to-tier mapping

### Tier A defaults

- docs-agent
- log-analyst-agent
- design-token-auditor
- responsive-accessibility-auditor
- dev-runtime (routine diagnosis)
- **L3 economy:** `orchestrator` / area specialists for **plan-only** passes when the task stays **L3** (not L4) and the closeout records **L3 economy** (see `risk-tiering.mdc`).

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

## L3 economy (cost control)

When **L3 economy** is declared in the closeout (per `risk-tiering.mdc`):

- prefer **Tier A** for read-only / plan / triage sub-steps,
- keep **Tier C** for **security-agent**, **database-agent** on hot paths, and **change-verifier** on L3/L4 gates as required,
- do not use economy to skip **mandatory** verifiers or sensitive-path reviews.

## Escalation policy

Use staged escalation:

1. Tier A
2. Tier B if unresolved ambiguity/risk remains
3. Tier C only when lower tiers are insufficient

If escalating, include rationale in closeout:

- what remained unresolved,
- why higher tier is needed,
- expected value from escalation.

## Budget policy (session envelope)

For **L2+** work, define a **session budget envelope** in the first relevant assistant message: token/cost/time soft targets.

- **Hard stop (kit policy):** if the running estimate **exceeds the declared envelope**, **stop and ask the user** before more delegation. The user may raise the envelope in chat.
- If exceeded, record in closeout: exceedance reason, mitigation, `budget_outcome` (within / near-limit / exceeded + reason if exceeded). Use `budget-governance-skill` for L3/L4 or cost-critical work.

**L1** and explicit “unbounded exploration” requests are exempt from envelope unless the user set a cap.

## Data handling constraints

- never include secrets or sensitive credentials in prompts,
- minimize sensitive data exposure in delegation payloads,
- follow repository security rules and environment constraints.
