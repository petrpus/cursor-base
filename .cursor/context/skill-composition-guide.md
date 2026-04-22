# Skill Composition Guide

How to use the two-tier skill system to run inline checks before (or instead of) full specialist delegation.

## Two tiers

| Tier | Purpose | Cost | When to use |
|------|---------|------|-------------|
| **Level 2 — Micro-check** | Single focused question, binary/enumerated result | Inline — no delegation | Before deciding whether to delegate; catches obvious issues fast |
| **Level 3+ — Composite** | Full specialist workflow, multi-step procedure | Targeted delegation | When L2 finds a FAIL, or risk tier requires full review |

Running L2 skills inline is **always cheaper** than delegating. The goal: only delegate to a specialist when an L2 check returns FAIL or the task's risk tier mandates a full review.

## Standard inline skill pass (Step 5 of main workflow)

Before delegating to any specialist, run the L2 skills that match the changed areas. Collect all FAIL/WARN results, then delegate only once with all findings bundled:

```
1. Identify changed areas (security? db? api? frontend? jobs? config?)
2. Run matching L2 skills (see registry below)
3. Collect results — PASS = skip that specialist; FAIL = delegate with findings
4. Bundle all FAILs into one or two focused delegation calls (not one per FAIL)
```

## Skill selection by changed area

### Security-sensitive changes
Run all four in parallel when any route, auth, or input-handling code changes:
- `auth-boundary-check-skill` — are endpoints auth-gated?
- `input-sanitization-check-skill` — is user input validated before sinks?
- `secret-leak-check-skill` — are secrets safe from logs/responses/bundles?
- `privilege-escalation-check-skill` — can a user gain unauthorized access?

If any FAIL → delegate to `security-agent` with all findings in one call.
If all PASS → skip `security-agent` unless risk tier is L3/L4 (then delegate for full review anyway).

### Database changes
Run matching checks when schema, migration, or query code changes:
- `migration-reversibility-check-skill` — for every new migration file
- `migration-data-loss-check-skill` — for every migration that drops/modifies
- `query-index-check-skill` — for new query patterns
- `n-plus-one-check-skill` — for new list-fetching code

If any FAIL → delegate to `database-agent` with all findings.

### API surface changes
- `api-breaking-change-check-skill` — for any type/route/schema change
- `error-handling-coverage-check-skill` — for new async/external-call code

FAIL(field-removal/endpoint-change) → `api-contract-agent`.
FAIL(raw-exception-response) → `security-agent`.
FAIL(missing-5xx-log) → `observability-agent`.

### Testing
Run before finalizing any implementation:
- `test-coverage-gap-check-skill` — are new branches tested?
- `test-isolation-check-skill` — are new tests properly isolated?
- `regression-surface-check-skill` — which existing tests are at risk?

FAIL → `testing-agent`. Use regression surface output as the minimum test set for `change-verifier`.

### Frontend / UI changes
- `a11y-interactive-check-skill` — for new interactive elements
- `render-performance-check-skill` — for new components/hooks
- `design-token-usage-check-skill` — for any new styles

Simple FAILs (index key, positive tabindex) → inline-fix.
Complex FAILs → `ux-accessibility-agent` or `frontend-architecture-agent`.
Design token FAILs → `design-system-agent`.

### Config / environment changes
- `env-declaration-check-skill` — for any new `process.env.*` reads
- `feature-flag-check-skill` — for any new boolean toggles

Most FAILs are inline-fixable. Security-gating flag failures → `security-agent`.

### Background jobs / queue changes
- `job-idempotency-check-skill` — for any new job/worker
- `job-failure-handling-check-skill` — for any new job definition

FAIL → `jobs-agent`.

### Documentation
- `docs-staleness-check-skill` — for any behavioral change

Always run this. WARN output is input to `docs-agent` or `docs-sync-skill`.

## Bundling delegation calls

Do not issue one delegation per FAIL. Bundle:

```
Good: delegate to security-agent once with:
  - FAIL(unguarded-route) from auth-boundary-check
  - FAIL(log-exposure) from secret-leak-check

Bad: delegate to security-agent twice, once per finding
```

## When to skip L2 and delegate directly

Skip L2 pre-checks and delegate directly to the specialist when:
- Risk tier is L4 (always full specialist review, L2 results are supplementary)
- The area is entirely new to you (unfamiliar codebase — adopt first, then check)
- The specialist is already delegated for another reason in the same batch (bundle)

## Composite skill invocation (Level 3+)

When a specialist is invoked, they may use composite skills internally:
- `schema-migration-safety-skill` — full migration safety review (database-agent)
- `security-review-skill` — full security review (security-agent)
- `regression-risk-assessment-skill` — full regression coverage plan (testing-agent)
- `verification-orchestration-skill` — full verification plan (change-verifier)

These are not inline — they run inside the specialist's delegation context.
