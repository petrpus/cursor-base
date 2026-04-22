# Specialist routing reference

Full matrix for when path-scoped rules (globs) do not already name specialists. Use with `.cursor/rules/orchestration/risk-tiering.mdc` and `main-orchestration.mdc`.

| Area | Specialist(s) |
|------|----------------|
| Shared UI components, tokens, styling, variants | `design-system-agent` or `design-system-guardian` |
| Route modules, pages, forms, tables, admin UX, layout | `frontend-architecture-agent` |
| Accessibility, keyboard flow, responsive, empty/loading/error states | `ux-accessibility-agent` or `responsive-accessibility-auditor` |
| Routes, loaders, actions, auth, uploads, secrets, sensitive ops | `security-agent` |
| Behavior changes, regressions, features, bug fixes | `testing-agent` |
| Schemas, DTOs, I/O validation, contract changes | `api-contract-agent` |
| Prisma schema, migrations, queries, indexing, transactions | `database-agent` |
| Queues, background jobs, retries, DLQ | `jobs-agent` |
| Logging, tracing, auditability | `observability-agent` |
| Domain-critical business rules | `domain-agent` |
| Large cleanup or simplification | `refactor-agent` |
| Local runtime, diagnosis | `dev-runtime` |
| Documentation, `docs/` organization | `docs-agent` |
| Render/query/bundle performance | `performance-agent` |
| Env vars, feature flags, startup config | `env-config-agent` |
| Dependency security, licenses, supply chain | `dependency-audit-agent` |
| Seed fixtures, test factories | `seed-agent` |
| Session metrics, delegation patterns, cost analysis | `metrics-analyst-agent` |

Path-based triggers: see `.cursor/rules/frontend/frontend-triggers.mdc`, `security/security-triggers.mdc`, and other `*.mdc` under `.cursor/rules/`.
