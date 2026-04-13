# .cursor/context — Universal context only

This directory may contain **only universal, project-agnostic context** that applies to any repository using this Cursor kit. It must **not** contain project-specific information (architecture, domain, product names, or conventions unique to one codebase).

## Rule

- **Allowed**: Stack baseline, generic adoption workflow, generic security/testing/domain **triggers**, and the project-docs contract (which states where project knowledge lives).
- **Not allowed**: Descriptions of this repo’s domain (e.g. loans, journals, penalties, schedules), file paths specific to this app, product names, or any “how we do X in this project” that wouldn’t apply to another project using the same kit.

Project-specific context lives in **docs/ai** and **docs/**. See **project-docs-contract.md** and **docs/ai/SEPARATION.md** for the full boundary.

## Files in this directory (and their role)

| File | Role | Universal? |
| ---- | ---- | ---------- |
| **project-docs-contract.md** | Defines that project knowledge is in docs/ai and docs/; .cursor is shared tooling. | Yes (contract) |
| **stack.md** | Tech stack baseline (TypeScript, React, Prisma, etc.). | Yes |
| **stack-profile.md** | Stack + operational assumptions (verification, commit hygiene, .cursor/local, .cursor/docs). | Yes |
| **repo-adoption-instruction.md** | Generic adoption steps when entering unfamiliar areas. | Yes |
| **security-baseline.md** | When to trigger security review (routes, auth, uploads, etc.). | Yes |
| **testing-strategy.md** | Verification layers (unit/integration/e2e) and minimum expectations. | Yes |
| **frontend-guidelines.md** | Generic frontend expectations and agent split (design-system vs frontend-arch vs UX). | Yes |
| **domain-rules.md** | When to use the Domain Agent — **generic triggers only**; project-specific domain areas are in docs/ai. | Yes (must stay generic) |
| **model-governance.md** | Agent model-tier policy, escalation rules, and budget controls. | Yes |
| **delegation-metrics.md** | Delegation ledger and governance scorecard schema for measurable efficiency/quality. | Yes |

If you add a new file here, it must be universal. Otherwise, add the content to **docs/ai/** (and **docs/** if it’s deep reference).
