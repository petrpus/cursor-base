---
name: accessibility-flow-check-skill
description: Check keyboard flow, focus management, semantics, and state clarity for user-facing changes.
owner_agent: ux-accessibility-agent
secondary_agents:
  - responsive-accessibility-auditor
  - frontend-architecture-agent
  - change-verifier
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
  - residual_risk
  - verification_needs
version: 1.0.0
---

# Accessibility Flow Check Skill

## Intent
Validate accessibility and interaction quality of changed UI flows.

## When to invoke
- Route/page/form/dialog changes.
- Error, loading, or empty-state behavior changes.
- Shared component updates likely to affect semantics or focus behavior.

## When not to invoke
- Backend-only changes without UI surface impact.

## Inputs required
- UI scope and changed components/routes.
- Expected interaction behavior.
- Target device classes when relevant.

## Procedure
1. Review changed UI surfaces and interaction pathways.
2. Assess keyboard navigation and focus transitions.
3. Validate semantic structure and labeling signals.
4. Check state clarity for loading, empty, validation-error, and failure modes.
5. Identify practical fixes and required verification follow-up.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]`
- `recommendations[]`
- `risks[]`
- `residual_risk`
- `verification_needs[]`
- `confidence`

## Quality checklist
- Keyboard flow includes critical actions.
- Focus is predictable after dialog/form/route transitions.
- Labels and semantics are sufficient for assistive interpretation.
- Error/empty/loading states are understandable.

## Anti-patterns
- Deferring all accessibility concerns to future work without impact statement.
- Checking visual styling only while ignoring interaction semantics.

## Model guidance
- Tier B default.
- Escalate to Tier C for high-risk regulated user flows.

## Telemetry tags
- `skill_name: accessibility-flow-check`
- `skill_mode: standard|strict`
- `skill_outcome: pass|warn|fail`
- `skill_confidence: low|medium|high`
