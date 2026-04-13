# Main Orchestration Rule

For any non-trivial task, the built-in Agent must act as an orchestrator first and an implementer second.

When instructions conflict, follow `.cursor/rules/01-policy-precedence.mdc`.

## Required workflow
1. identify affected areas by task intent and touched files
2. assign risk tier using `.cursor/rules/orchestration/risk-tiering.mdc` (L1-L4, highest-tier-wins)
3. adopt repository state first when the area is unfamiliar, architecture-sensitive, or design-system-sensitive — **use docs/ai as the primary project context** (docs/ai/README.md, docs/ai/AGENT_ADOPTION.md, docs/ai/source-of-truth.md, then relevant docs/ai navigation docs and docs/)
4. make a short plan with specialist matrix and budget envelope
5. explicitly delegate to the matching specialist subagents before implementation (parallelize independent reviews per `.cursor/rules/orchestration/parallel-delegation.mdc`)
6. summarize specialist findings and resolve conflicts
7. implement using the agreed approach (single-writer default per phase)
8. run `change-verifier` before preparing commit(s)
9. run `compliance-verifier` for L4 or policy-sensitive changes
10. consult `commit-agent` to prepare final commit boundaries and messages according to `.cursor/rules/commit/commit-policy.md`

## Mandatory specialist routing
- shared UI components, tokens, styling rules, component variants -> `design-system-agent` or `design-system-guardian`
- route modules, pages, forms, tables, admin UX, layout composition -> `frontend-architecture-agent`
- accessibility, keyboard flow, responsive behavior, error/empty/loading states -> `ux-accessibility-agent` or `responsive-accessibility-auditor`
- routes, loaders, actions, auth, uploads, secrets, sensitive operations -> `security-agent`
- behavior changes, regressions, new features, bug fixes -> `testing-agent`
- schemas, DTOs, input/output validation, contract changes -> `api-contract-agent`
- Prisma schema, migrations, query shape, indexing, transactions -> `database-agent`
- logging, tracing, auditability, jobs, background processing -> `observability-agent`
- domain-critical business rules -> `domain-agent`
- large cleanup or simplification work -> `refactor-agent`
- local runtime operations or diagnosis -> `dev-runtime`
- documentation updates, API docs, READMEs, `docs/`, doc organization or interlinking -> `docs-agent`

## Hard rules
- do not skip a matching specialist for convenience
- do not recommend a commit before verification
- follow `.cursor/rules/commit/commit-policy.md` for whether commit operations are prepare-only or allowed in this environment
- do not let a UI system change bypass design-system review
- do not let a route, auth, upload, or permission change bypass security review
- do not let a schema or migration change bypass database review
- include delegation transparency closeout fields required by `.cursor/rules/orchestration/delegation-transparency.mdc`

## Delegation reporting (mandatory for non-trivial tasks)
Before final delivery, include a short "Delegation report" section with:
- why delegation was required for this task
- which specialist(s) were called and for what scope
- what each specialist recommended
- whether recommendations were applied (and why/why not)
- verification checks run after implementation and their outcome

If any matching specialist was intentionally not called, explicitly state:
- the skipped specialist name
- concrete reason for skipping
- risk accepted by skipping
