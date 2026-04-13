---
name: budget-governance-skill
description: Keep delegation and verification execution within soft token/cost/time budgets while preserving risk-appropriate quality.
owner_agent: orchestrator
secondary_agents:
  - log-analyst-agent
  - compliance-verifier
default_model_tier: B
allowed_risk_tiers:
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - budget_envelope
  - planned_specialists
required_outputs:
  - budget_status
  - overrun_rationale
  - optimization_actions
version: 1.0.0
---

# Budget Governance Skill

## Intent
Keep task execution within budget guardrails while preserving required quality and risk controls.

## When to invoke
- Non-trivial tasks with explicit budget envelope.
- Repeated delegation rounds or verification retries.
- L4 tasks (strict mode mandatory).

## When not to invoke
- L1 tasks with trivial scope and no measurable budget concern.

## Inputs required
- `task_id`
- `risk_tier`
- `budget_envelope` (token/cost/time soft limits)
- current and planned specialist/model usage
- verification plan and expected depth

## Procedure
1. Compare planned execution to budget envelope.
2. Identify the heaviest budget contributors (model tier, parallel fan-out, repeated checks).
3. Preserve mandatory risk-tier controls and only optimize optional work.
4. Propose lower-cost alternatives (tier downgrade, scope narrowing, serialization, targeted checks).
5. Emit an overrun rationale if limits must be exceeded.

## Output contract
- `summary`
- `budget_status`: within | near-limit | exceeded
- `major_cost_drivers[]`
- `optimization_actions[]`
- `overrun_rationale` (required when exceeded)
- `quality_protection_notes[]`
- `follow_ups[]`

## Quality checklist
- Required specialists and gates are not removed for budget reasons.
- Overrun rationale is explicit when budget is exceeded.
- At least one concrete optimization action is provided when near-limit or exceeded.

## Anti-patterns
- Blindly cutting validation to save tokens.
- Over-parallelizing reviews when serial execution would suffice.
- Switching to lower-tier models for high-risk decisions without safety rationale.

## Model guidance
- Tier B default.
- Escalate to Tier C only when budget decisions involve high-risk security/compliance tradeoffs.

## Telemetry tags
- `skill_name=budget-governance`
- `skill_mode=standard|strict`
- `skill_outcome=pass|warn|fail`
- `skill_confidence=low|medium|high`
