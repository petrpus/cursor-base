---
name: exception-waiver-recording-skill
description: Record, justify, and time-box deviations from required governance gates.
owner_agent: compliance-verifier
secondary_agents:
  - orchestrator
  - docs-agent
  - security-agent
default_model_tier: B
allowed_risk_tiers:
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - gate_deviation
  - requested_by
  - approver_role
  - expiry_condition
required_outputs:
  - waiver_record
  - controls_summary
  - follow_up_actions
version: 1.0.0
---

# Exception Waiver Recording Skill

## Intent
Create auditable waiver records when required gates cannot be satisfied.

## When to invoke
- Any temporary bypass of required specialist or verification gates.
- Any L4 deviation from mandatory compliance/security process.

## When not to invoke
- No gate deviation exists.
- Routine non-risky process variation.

## Inputs required
- `task_id`, `risk_tier`, `gate_deviation`, `requested_by`, `approver_role`, `expiry_condition`, compensating controls.

## Procedure
1. Validate that a deviation truly exists and cannot be avoided.
2. Capture exact gate(s) bypassed and reason.
3. Capture approver role and time-bounded expiry condition.
4. Define compensating controls and mandatory follow-up.
5. Return waiver record for closeout and governance logs.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `waiver_record`:
  - `task_id`
  - `risk_tier`
  - `bypassed_gates[]`
  - `justification`
  - `requested_by`
  - `approver_role`
  - `approval_timestamp`
  - `expiry_condition`
- `controls_summary`
- `follow_up_actions[]`
- `residual_risk`
- `confidence`

## Quality checklist
- Waiver includes explicit scope and expiry.
- Compensating controls are concrete and testable.
- Follow-up action is assigned and auditable.

## Anti-patterns
- Indefinite waivers without expiry.
- Missing approver role.
- Narrative-only waiver without explicit bypass list.

## Model guidance
- Tier B default.
- Tier C for L4 waivers involving security/data controls.

## Telemetry tags
- `skill_name: exception-waiver-recording-skill`
- `skill_mode: strict`
- `skill_outcome: pass|warn|fail`
- `waiver_present: true`
