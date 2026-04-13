# .cursor/skills

This directory contains reusable, universal skill playbooks for the Cursor kit.

## Design goals

- make delegation deterministic and auditable
- reduce repeated prompt engineering overhead
- improve quality by enforcing consistent input/output contracts
- improve efficiency by guiding model tier and budget usage

## Required structure for each skill file

- frontmatter with owner, model tier, risk tiers, and required I/O fields
- sections:
  - Intent
  - When to invoke
  - When not to invoke
  - Inputs required
  - Procedure
  - Output contract
  - Quality checklist
  - Anti-patterns
  - Model guidance
  - Telemetry tags

## Core skill set

- risk-triage-skill
- delegation-planning-skill
- verification-orchestration-skill
- regression-risk-assessment-skill
- security-review-skill
- compliance-gate-evaluation-skill
- schema-migration-safety-skill
- api-contract-compatibility-skill
- ui-governance-audit-skill
- accessibility-flow-check-skill
- docs-sync-skill
- change-closeout-reporting-skill

## Advanced skill set

- conflict-resolution-skill
- budget-governance-skill
- exception-waiver-recording-skill
