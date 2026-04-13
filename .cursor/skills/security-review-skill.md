---
name: security-review-skill
description: Structured security review for auth, trust boundaries, exposure, and sensitive flows.
owner_agent: security-agent
secondary_agents:
  - compliance-verifier
  - change-verifier
  - orchestrator
default_model_tier: B
allowed_risk_tiers:
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - touched_files
  - acceptance_criteria
  - constraints
required_outputs:
  - findings
  - risks
  - recommendations
  - residual_risk
  - verification_needs
version: 1.0.0
---

# Security Review Skill

## Intent

Identify and prioritize security risks introduced or affected by the change, and define required controls before finalization.

## When to invoke

- auth/authz, permissions, session, or identity behavior changes
- route/action/loader handler changes
- uploads, secrets, sensitive data, admin flows
- API boundary changes with trust implications
- all L3/L4 tasks

## When not to invoke

- purely editorial documentation updates with no behavioral impact
- strictly local refactors with no trust-boundary impact (and confirmed by risk-triage)

## Inputs required

- normalized skill payload (task_id, risk_tier, change_type, scope, constraints)
- known sensitive assets and boundaries from docs/ai or source-of-truth references
- touched files and related routes/services

## Procedure

1. map trust boundaries and sensitive assets touched by the task
2. inspect authn/authz and ownership/tenant implications
3. review input validation and output exposure paths
4. review secret handling and sensitive logging risks
5. evaluate abuse and privilege escalation possibilities
6. produce severity-ranked findings and required controls

## Output contract

- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]` (id, severity, impacted_area, description)
- `decision`
- `recommendations[]` (required vs optional)
- `risks[]` (likelihood/impact)
- `residual_risk`
- `verification_needs[]`
- `budget_impact`
- `confidence`

## Quality checklist

- findings map to concrete code paths and behaviors
- severities are justified and actionable
- required controls are explicit and testable
- residual risk is clearly stated

## Anti-patterns

- generic warnings without repository evidence
- calling everything high severity
- skipping logging/data-exposure review
- not considering tenant/ownership boundaries

## Model guidance

- default Tier B for L2 reviews
- escalate to Tier C for L3/L4 or ambiguous high-impact exposure

## Telemetry tags

- `skill_name:security-review`
- `skill_version:1.0.0`
- `skill_mode:standard|strict`
- `skill_outcome:pass|warn|fail`
- `skill_confidence:low|medium|high`
