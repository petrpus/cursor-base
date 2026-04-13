---
name: api-contract-compatibility-skill
description: Ensure request/response contract changes are valid, consistent, and safely rolled out.
owner_agent: api-contract-agent
secondary_agents: [security-agent, testing-agent, change-verifier]
default_model_tier: B
allowed_risk_tiers: [L2, L3, L4]
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - touched_files
  - acceptance_criteria
  - api_surface_description
required_outputs:
  - summary
  - findings
  - recommendations
  - risks
  - verification_needs
  - residual_risk
version: 1.0.0
---

# API Contract Compatibility Skill

## Intent
Validate API input/output shape compatibility, validation consistency, and breaking-change risk.

## When to invoke
- API endpoint behavior changes.
- DTO/schema/validation changes.
- Any route/action returning changed payload shapes.

## When not to invoke
- Pure internal refactors with unchanged API surface.

## Procedure
1. Identify affected endpoints/actions.
2. Compare old vs new input/output contracts.
3. Check validation path and error model consistency.
4. Identify compatibility and migration risk.
5. Define required tests and rollout notes.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]`
- `recommendations[]`
- `risks[]` (severity-labeled)
- `verification_needs[]`
- `residual_risk`
- `confidence`

## Quality checklist
- Input validation is explicit and consistent.
- Output shape changes are documented.
- Breaking changes are identified and mitigated.
- Error contract remains consistent.

## Anti-patterns
- Only checking compile-time types without runtime validation.
- Ignoring downstream consumers.

## Model guidance
- Tier B default.
- Escalate to Tier C for high-risk contract changes with broad client impact.

## Telemetry tags
- `skill_name: api-contract-compatibility`
- `skill_mode: standard|strict`
- `skill_outcome: pass|warn|fail`
