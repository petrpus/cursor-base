---
name: compliance-gate-evaluation-skill
description: Evaluate whether required process, policy, and approval gates were satisfied.
owner_agent: compliance-verifier
secondary_agents:
  - change-verifier
  - orchestrator
default_model_tier: C
allowed_risk_tiers:
  - L3
  - L4
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - required_gates
  - executed_steps
  - waivers
required_outputs:
  - gate_status
  - failed_gates
  - waivers_status
  - residual_policy_risk
version: 1.0.0
---

# Intent
Determine whether the task followed mandatory workflow, specialist routing, verification, and approval requirements.

# When to invoke
- L4 tasks (mandatory).
- L3 tasks with security, data, migration, or policy-sensitive impact.
- Any task that requests exception handling or gate bypass.

# When not to invoke
- Clearly scoped L1 tasks with no policy-sensitive behaviors.

# Inputs required
- Standard skill input contract.
- Required gate list from risk-tiering + change-type overlays.
- Evidence of specialist outputs and verification.
- Waiver records and approval metadata (if any).

# Procedure
1. Enumerate required gates from policy.
2. Match each gate against evidence.
3. Validate that approvals are present where required.
4. Validate waiver scope and expiry.
5. Assess residual policy risk.

# Output contract
- `summary`
- `gate_status`: pass | pass-with-waivers | fail
- `failed_gates[]`
- `waivers_status[]`
- `residual_policy_risk`
- `recommendations[]`
- `follow_ups[]`

# Quality checklist
- Every required gate has either evidence or explicit, valid waiver.
- Approval requirements are satisfied for L4.
- Failed gates are concrete and actionable.

# Anti-patterns
- Marking pass with undocumented waivers.
- Treating narrative claims as sufficient evidence.
- Ignoring approval expiry requirements.

# Model guidance
- Tier C default for L3/L4 due to policy interpretation sensitivity.
- Escalate only if evidence is ambiguous.

# Telemetry tags
- `skill_name: compliance-gate-evaluation-skill`
- `skill_mode: standard`
- `skill_outcome`
- `skill_confidence`
