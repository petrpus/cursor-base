# .cursor/skills

Reusable skill playbooks for the Cursor kit. Two tiers:

- **Level 2 — Micro-check skills**: single focused question, binary/enumerated output, run inline before deciding whether to delegate. Fast and cheap.
- **Level 3+ — Composite skills**: full specialist workflow, multi-step procedure, run inside a specialist delegation. Thorough but costly.

See `.cursor/context/skill-composition-guide.md` for how to combine tiers and when to delegate vs. check inline.

## Design goals

- Deterministic delegation: run L2 checks first; only delegate on FAIL or mandatory L3/L4 requirement
- Reduce repeated prompt engineering: structured input/output contracts
- Improve efficiency: L2 checks prevent unnecessary full-specialist delegation
- Consistent evidence: telemetry tags on every skill output

## Level 2 — Micro-check skills (inline)

### Security
- `auth-boundary-check-skill` — are endpoints auth-gated?
- `input-sanitization-check-skill` — are user inputs validated before sinks?
- `secret-leak-check-skill` — are secrets safe from logs/responses/bundles?
- `privilege-escalation-check-skill` — can a user gain unauthorized access?

### Database
- `migration-reversibility-check-skill` — is the migration safely reversible?
- `migration-data-loss-check-skill` — does the migration risk data loss?
- `query-index-check-skill` — are new query patterns indexed?
- `n-plus-one-check-skill` — do new list patterns risk N+1 queries?

### API
- `api-breaking-change-check-skill` — does this break existing API consumers?
- `error-handling-coverage-check-skill` — are error paths handled and typed?

### Testing
- `test-coverage-gap-check-skill` — are new branches covered by tests?
- `test-isolation-check-skill` — are new tests properly isolated?
- `regression-surface-check-skill` — which existing tests are at risk?

### Frontend
- `a11y-interactive-check-skill` — do interactive elements meet a11y basics?
- `render-performance-check-skill` — do components risk unnecessary re-renders?
- `design-token-usage-check-skill` — do styles use tokens, not hardcoded values?

### Config / environment
- `env-declaration-check-skill` — are new env vars in `.env.example`?
- `feature-flag-check-skill` — are new flags documented with removal conditions?

### Jobs / async
- `job-idempotency-check-skill` — is the job idempotent on retry?
- `job-failure-handling-check-skill` — are retry, DLQ, and timeout configured?

### Documentation
- `docs-staleness-check-skill` — which docs are likely stale after this change?

## Level 3+ — Composite skills (specialist-internal)

- `risk-triage-skill` — assign risk tier and required specialist set
- `delegation-planning-skill` — build minimum-complete routing plan
- `security-review-skill` — full security review (security-agent)
- `schema-migration-safety-skill` — full migration safety review (database-agent)
- `api-contract-compatibility-skill` — full contract compatibility review (api-contract-agent)
- `regression-risk-assessment-skill` — full regression coverage plan (testing-agent)
- `verification-orchestration-skill` — full verification plan (change-verifier)
- `ui-governance-audit-skill` — full UI governance review (design-system-agent)
- `accessibility-flow-check-skill` — full accessibility audit (ux-accessibility-agent)
- `docs-sync-skill` — full docs update (docs-agent)
- `change-closeout-reporting-skill` — structured closeout report (orchestrator)
- `compliance-gate-evaluation-skill` — policy gate evaluation (compliance-verifier)

## Advanced skills

- `conflict-resolution-skill` — resolve conflicting specialist recommendations
- `budget-governance-skill` — enforce token/cost/time budgets
- `exception-waiver-recording-skill` — record and time-box governance deviations
