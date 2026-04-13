---
name: ui-governance-audit-skill
description: Validate that UI changes follow project UI stack, design-system, and accessibility governance.
owner_agent: design-system-agent
secondary_agents:
  - frontend-architecture-agent
  - ux-accessibility-agent
default_model_tier: B
allowed_risk_tiers:
  - L1
  - L2
  - L3
required_inputs:
  - task_id
  - risk_tier
  - change_type
  - touched_files
  - acceptance_criteria
required_outputs:
  - summary
  - findings
  - recommendations
  - risks
  - residual_risk
  - verification_needs
version: 1.0.0
---

# UI Governance Audit Skill

## Intent
Verify that user-facing UI changes align with established stack, component, token, and accessibility standards.

## When to invoke
- shared component or token changes
- route/page/form/dialog/table changes
- responsive behavior or interaction-state changes
- any UI task with L2+ risk tier

## When not to invoke
- non-UI backend-only changes
- docs-only changes unrelated to UI behavior

## Inputs required
- `task_id`
- `risk_tier`
- `change_type`
- `touched_files[]`
- `acceptance_criteria[]`
- `constraints[]`

## Procedure
1. Read project UI sources: `docs/ai/ui-stack.md`, `docs/ai/design-system.md`, `docs/ai/ui-patterns.md` when available.
2. Map changed files to UI areas (shared components, routes, forms, states).
3. Validate consistency of:
   - component API/variant usage
   - token and utility-class usage
   - layout and responsiveness
   - accessibility semantics and interaction states
4. Produce concrete fixes and route to needed specialists.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]`
- `decision`
- `recommendations[]`
- `risks[]`
- `residual_risk`
- `verification_needs[]`
- `budget_impact`
- `confidence`

## Quality checklist
- every finding cites changed UI files
- includes accessibility and responsive considerations
- identifies whether docs updates are required for reusable rules

## Anti-patterns
- cosmetic-only review without interaction-state coverage
- suggesting new patterns when existing conventions already solve the issue

## Model guidance
- Tier B default
- escalate to Tier C only for high-risk UX/security intersections

## Telemetry tags
- `skill_name=ui-governance-audit-skill`
- `skill_version=1.0.0`
- `skill_mode=standard|strict`
- `skill_outcome=pass|warn|fail`
- `skill_confidence=low|medium|high`
