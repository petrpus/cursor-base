---
name: regression-risk-assessment-skill
description: Assess regression risk and define test depth by change type and risk tier.
owner_agent: testing-agent
secondary_agents:
  - change-verifier
  - orchestrator
  - frontend-architecture-agent
  - api-contract-agent
default_model_tier: B
allowed_risk_tiers:
  - L1
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - touched_files
  - acceptance_criteria
required_outputs:
  - findings
  - recommendations
  - verification_needs
  - residual_risk
version: 1.0.0
---

# Regression Risk Assessment Skill

## Intent
Estimate behavioral regression likelihood and identify where breakage is most likely.

## When to invoke
- Any behavior-changing task.
- Any task that touches routes, forms, loaders/actions, schema, contracts, or shared components.

## When not to invoke
- Purely editorial docs work with no behavior impact.

## Inputs required
- Universal skill input contract.
- Prior test coverage context (if available).

## Procedure
1. Group changed areas by behavior surface.
2. Identify downstream dependencies likely to regress.
3. Rank risk by severity and blast radius.
4. Map each risk item to minimum verification scope.
5. Provide fallback checks when full automation is unavailable.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]` (high/medium/low regression likelihood)
- `decision`
- `recommendations[]`
- `risks[]`
- `residual_risk`
- `follow_ups[]`
- `verification_needs[]`
- `budget_impact`
- `confidence`

## Quality checklist
- Highest-risk flows are explicitly called out.
- Recommendations are testable and specific.
- Residual untested risk is documented.

## Anti-patterns
- Declaring low risk without citing impacted behaviors.
- Recommending exhaustive tests for low-risk changes.

## Model guidance
- Tier B default.
- Tier C allowed for L4 high-blast-radius work.

## Telemetry tags
- `skill_name: regression-risk-assessment`
- `skill_mode: light|standard|strict`
- `skill_outcome: pass|warn|fail`
- `skill_confidence: low|medium|high`
