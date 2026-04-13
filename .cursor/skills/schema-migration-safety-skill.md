---
name: schema-migration-safety-skill
description: Validate migration safety, reversibility, and integrity risks for Prisma/schema/data changes.
owner_agent: database-agent
secondary_agents:
  - api-contract-agent
  - change-verifier
default_model_tier: B
allowed_risk_tiers:
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - touched_files
  - acceptance_criteria
  - required_evidence_level
required_outputs:
  - summary
  - findings
  - recommendations
  - risks
  - residual_risk
  - verification_needs
version: 1.0.0
---

# Schema Migration Safety Skill

## Intent
Prevent unsafe schema and migration changes by requiring explicit analysis of data loss risk, lock risk, rollback feasibility, and compatibility.

## When to invoke
- Any change touching `schema.prisma`, migrations, SQL files, relation semantics, index strategy, or transaction boundaries.

## When not to invoke
- Pure documentation updates with no data model or query behavior impact.

## Inputs required
- Normalized input contract plus:
  - migration intent (expand/contract/rename/drop),
  - expected data volume sensitivity if known,
  - deployment/rollout constraints if known.

## Procedure
1. Classify migration type (safe additive, backfill-required, destructive, ambiguous).
2. Identify data loss and lock-contention risk.
3. Evaluate backward/forward compatibility windows.
4. Define rollback or mitigation strategy expectations.
5. Specify verification needs (tests/checks) and monitoring recommendations.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]`
- `decision` (safe-as-is | safe-with-conditions | unsafe)
- `recommendations[]`
- `risks[]` (include `severity`)
- `residual_risk`
- `verification_needs[]`
- `budget_impact`
- `confidence`

## Quality checklist
- Explicitly addresses data-loss risk.
- Explicitly addresses migration ordering risk.
- Includes rollback or compensating-control guidance.
- Distinguishes blocking vs non-blocking concerns.

## Anti-patterns
- Approving destructive changes without safeguards.
- Ignoring relation/index side effects.
- Confusing test success with migration safety.

## Model guidance
- Default Tier B.
- Escalate to Tier C for destructive or high-volume/high-criticality migrations.

## Telemetry tags
- `skill_name:schema-migration-safety`
- `skill_mode:standard|strict`
- `risk_profile:migration`
