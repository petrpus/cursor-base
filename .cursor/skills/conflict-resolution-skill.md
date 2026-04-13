---
name: conflict-resolution-skill
description: Resolve conflicting specialist recommendations with documented trade-offs.
owner_agent: orchestrator
secondary_agents:
  - compliance-verifier
  - change-verifier
default_model_tier: B
allowed_risk_tiers:
  - L2
  - L3
  - L4
required_inputs:
  - conflicting_findings
  - risk_tier
  - acceptance_criteria
required_outputs:
  - decision_record
  - rejected_alternatives
  - residual_risk
version: 1.0.0
state: draft
---

# Conflict Resolution Skill

## Intent
Resolve high-impact recommendation conflicts without hidden assumptions.

## When to invoke
- Specialists disagree on architecture, security, or verification priorities.

## Procedure
1. Normalize each recommendation into decision options.
2. Score options against acceptance criteria and risk tolerance.
3. Choose option with best quality-risk-cost profile.
4. Record rejected alternatives and trade-offs.

## Output contract
- `summary`
- `options_considered[]`
- `decision`
- `rationale`
- `rejected_alternatives[]`
- `residual_risk`

## Quality checklist
- Decision aligns with risk tier.
- No unresolved critical conflict remains.

## Model guidance
- Default Tier B; Tier C for L4 conflicts with security/compliance impact.
