---
name: verification-orchestration-skill
description: Build and execute the minimum sufficient verification plan for the task risk tier and changed surfaces.
owner_agent: change-verifier
secondary_agents:
  - testing-agent
  - orchestrator
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
  - required_evidence_level
required_outputs:
  - verification_plan
  - checks_run
  - results_summary
  - residual_risk
version: 1.0.0
telemetry_tags:
  - skill:verification-orchestration
---

# Verification Orchestration Skill

## Intent
Define and run a verification plan that matches risk and scope, avoiding both under-testing and wasteful over-testing.

## When to invoke
- Any task that changes behavior, schema, contracts, route handlers, or user-facing flows.
- Mandatory for L2+ tasks.

## When not to invoke
- Pure documentation-only tasks with no behavior/config/runtime effects.

## Inputs required
- Normalized task payload.
- Changed file list and key areas affected.
- Risk tier and acceptance criteria.

## Procedure
1. Identify verification domains: static checks, unit, integration, e2e, build.
2. Map domains to risk tier:
   - L1: targeted static checks.
   - L2: static + unit/integration as relevant.
   - L3: full static + unit + integration + build.
   - L4: full stack + explicit evidence bundle and gap statement.
3. Build minimal command plan with clear ordering.
4. Execute and capture outcomes.
5. If failures occur, route remediation (often via testing-agent/implementation).
6. Return pass/pass-with-warnings/fail with explicit residual risk.

## Output contract
- `summary`
- `assumptions[]`
- `verification_plan[]`
- `checks_run[]`
- `findings[]`
- `decision` (pass/pass-with-warnings/fail)
- `residual_risk`
- `follow_ups[]`
- `confidence`

## Quality checklist
- Verification depth matches risk tier.
- Evidence includes concrete checks run and outcomes.
- Untested surfaces are explicitly listed when present.

## Anti-patterns
- Treating compile success as full verification.
- Skipping relevant checks without rationale.

## Model guidance
- Tier B default.
- Tier C permitted for L4 verification or repeated unresolved failures.
