---
name: change-closeout-reporting-skill
description: Standardize final closeout output with delegation transparency, evidence, and residual risk.
owner_agent: orchestrator
secondary_agents:
  - docs-agent
  - change-verifier
default_model_tier: A
allowed_risk_tiers:
  - L1
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - acceptance_criteria
  - delegation_records
  - verification_results
  - budget_outcomes
required_outputs:
  - structured_closeout_report
version: 1.0.0
---

# Change Closeout Reporting Skill

## Intent

Generate a complete, auditable closeout that explains what was done, why delegation occurred, how quality was verified, and what residual risks remain.

## When to invoke

- for every non-trivial task,
- for all L2+ tasks as mandatory,
- before final recommendation/summary.

## When not to invoke

- tiny local queries with no repository edits.

## Inputs required

- task metadata (`task_id`, title, risk tier, change type),
- delegation ledger entries,
- specialist outcomes and conflict-resolution decisions,
- verifier and compliance outcomes,
- budget envelope and actual usage (if available).

## Procedure

1. summarize task scope and acceptance criteria status,
2. render delegation ledger table with rationale and outcomes,
3. document skipped specialists and compensating controls,
4. summarize conflicts and resolution decisions,
5. include verification evidence and final gate outcomes,
6. state residual risk and follow-up actions.

## Output contract

- `summary`,
- `acceptance_criteria_status[]`,
- `delegation_ledger[]`,
- `skipped_specialists[]`,
- `conflicts_and_decisions[]`,
- `verification_evidence[]`,
- `residual_risk`,
- `budget_report`,
- `follow_ups[]`.

## Quality checklist

- all required closeout sections present,
- delegation rationale is explicit and traceable,
- residual risk is explicit (none/low/medium/high),
- verification evidence is concrete and actionable.

## Anti-patterns

- reporting only outcomes without decisions/rationale,
- omitting skipped-specialist explanations,
- omitting residual risk or follow-up actions.

## Model guidance

- Tier A default,
- Tier B only when closeout synthesis is unusually complex.

## Telemetry tags

- `skill_name=change-closeout-reporting-skill`
- `skill_version=1.0.0`
- `skill_mode=compact|standard|strict`
- `skill_outcome=pass|warn|fail`
- `skill_confidence=low|medium|high`
