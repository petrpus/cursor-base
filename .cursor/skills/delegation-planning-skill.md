---
name: delegation-planning-skill
description: Build minimum-complete specialist routing and parallel execution plan.
owner_agent: orchestrator
secondary_agents: [compliance-verifier]
default_model_tier: B
allowed_risk_tiers: [L1, L2, L3, L4]
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - touched_files
  - acceptance_criteria
required_outputs:
  - delegation_matrix
  - parallel_batches
  - skip_justifications
version: 1.0.0
---

# Delegation Planning Skill

## Intent
Define the minimum complete specialist set and safe execution ordering.

## When to invoke
- any **L2+** task after risk triage
- any task with potential multi-specialist routing

## When not to invoke
- trivial one-file docs typo or similarly narrow no-risk task

## Inputs required
- normalized task payload
- risk tier from risk-triage-skill
- candidate touched paths

## Procedure
1. Start with mandatory specialists from risk tier and change type overlays.
2. Remove redundant specialists only with explicit rationale.
3. Group specialists into parallel-safe review batches.
4. Mark serial dependencies and conflict resolution checkpoints.
5. Identify single-writer phase owner.

## Output contract
- `delegation_matrix[]`:
  - `specialist`
  - `required` (true/false)
  - `reason`
  - `expected_output`
- `parallel_batches[]`:
  - `batch_id`
  - `specialists[]`
  - `dependency`
- `single_writer`
- `skipped_specialists[]` with rationale and compensating controls

## Quality checklist
- all mandatory specialists are included
- parallel groups have no overlapping write ownership
- every skip has rationale
- single writer explicitly chosen

## Anti-patterns
- delegating to every specialist “just in case”
- skipping security/testing on behavior changes
- no conflict resolution checkpoint

## Model guidance
- Tier B default
- escalate to Tier C only when high-risk conflict persists

## Telemetry tags
- `skill_name: delegation-planning`
- `skill_mode: standard`
- `skill_outcome`
