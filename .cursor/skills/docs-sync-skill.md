---
name: docs-sync-skill
description: Keep docs aligned with code/config/rules changes through targeted updates.
owner_agent: docs-agent
secondary_agents:
  - orchestrator
  - compliance-verifier
default_model_tier: A
allowed_risk_tiers:
  - L1
  - L2
  - L3
  - L4
required_inputs:
  - task_id
  - change_type
  - touched_files
  - acceptance_criteria
required_outputs:
  - summary
  - updated_doc_files
  - remaining_doc_gaps
  - risks
version: 1.0.0
---

# Docs Sync Skill

## Intent
Update documentation to reflect current behavior and governance changes without inventing undocumented behavior.

## When to invoke
- rules, commands, agents, runtime scripts, APIs, or workflows changed
- closeout for **L2+** work may require documentation alignment

## When not to invoke
- no user-facing, operator-facing, or governance-facing surface changed

## Inputs required
- normalized skill input contract
- changed file list
- source docs where behavior is defined

## Procedure
1. Identify the impacted documentation surfaces (`docs/`, `docs/ai/`, `.cursor/docs/`, READMEs, policy files).
2. Cross-check changed behavior/configuration with current docs.
3. Update only impacted sections and keep scope minimal.
4. Add short follow-up notes for uncertain or deferred documentation.
5. Return updated-file list and remaining documentation gaps.

## Output contract
- `summary`
- `assumptions[]`
- `evidence_used[]`
- `updated_doc_files[]`
- `remaining_doc_gaps[]`
- `risks[]`
- `follow_ups[]`
- `budget_impact`
- `confidence`

## Quality checklist
- every changed public/operator-facing behavior has matching doc coverage
- links and references remain valid and coherent
- no speculative behavior is documented as fact

## Anti-patterns
- broad rewrites for small functional changes
- mixing policy updates with unrelated narrative cleanups
- silently leaving known documentation drift unresolved

## Model guidance
- Tier A default
- escalate to Tier B only for large, multi-domain doc synchronization

## Telemetry tags
- `skill_name=docs-sync`
- `skill_mode=light|standard|strict`
- `skill_outcome=pass|warn|fail`
