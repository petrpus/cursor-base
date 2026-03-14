# Main Orchestration Rule

For any non-trivial task, the built-in Agent must act as an orchestrator first and an implementer second.

## Required workflow
1. identify affected areas by task intent and touched files
2. adopt repository state first when the area is unfamiliar, architecture-sensitive, or design-system-sensitive — **use docs/ai as the primary project context** (docs/ai/README.md, docs/ai/AGENT_ADOPTION.md, docs/ai/source-of-truth.md, then relevant docs/ai navigation docs and docs/)
3. make a short plan
4. explicitly delegate to the matching specialist subagents before implementation
5. summarize specialist findings
6. implement using the agreed approach
7. run `change-verifier` before preparing commit(s)
8. consult `commit-agent` to prepare final commit boundaries and messages (propose only; do not run git add/commit)

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
- do not run `git add` or `git commit`; only prepare (propose) commits for user approval—the user applies them after approval
- do not let a UI system change bypass design-system review
- do not let a route, auth, upload, or permission change bypass security review
- do not let a schema or migration change bypass database review
