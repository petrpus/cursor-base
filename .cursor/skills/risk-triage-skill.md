---
name: risk-triage-skill
description: Assign task risk tier and change type with explicit rationale.
owner_agent: orchestrator
secondary_agents:
  - change-verifier
  - compliance-verifier
default_model_tier: A
allowed_risk_tiers:
  - L1
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - task_title
  - acceptance_criteria
  - touched_files
  - constraints
required_outputs:
  - change_type
  - risk_tier
  - rationale
  - required_specialist_classes
version: 1.0.0
---

# Risk Triage Skill

## Intent
Classify the task consistently so routing, verification, and budgeting are proportional to risk.

## When to invoke
- Every non-trivial task.
- Any task with unclear impact scope.

## When not to invoke
- Tiny, local, obvious non-behavioral edits (for example typo-only docs fix).

## Inputs required
- `task_id`, `task_title`
- `acceptance_criteria[]`
- `touched_files[]` or expected scope
- constraints and compliance/security notes

## Procedure
1. Determine primary change type: ui/api/security/data/domain/docs/infra/mixed.
2. Evaluate potential impact:
   - data integrity or migration risk
   - auth/authz/secrets/session risk
   - domain-financial or compliance risk
   - user-facing regression risk
3. Assign tier L1-L4.
4. Apply highest-tier-wins if multiple concerns exist.
5. Output required specialist classes for this tier.

## Output contract
- `summary`
- `change_type`
- `risk_tier`
- `assumptions[]`
- `rationale`
- `required_specialist_classes[]`
- `residual_risk`
- `confidence`

## Quality checklist
- Tier assignment is justified by concrete risk factors.
- Highest-tier-wins rule applied where relevant.
- Specialist classes are explicit.

## Anti-patterns
- Picking low tier to reduce process overhead.
- Tier assignment without rationale.

## Model guidance
- Default Tier A.
- Escalate to Tier B if scope ambiguity remains high.

## Telemetry tags
- `skill_name=risk-triage-skill`
- `skill_mode=standard`
- `skill_outcome=pass|warn|fail`
