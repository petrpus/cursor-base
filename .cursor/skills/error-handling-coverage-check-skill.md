---
name: error-handling-coverage-check-skill
description: Check whether new code paths handle errors explicitly and do not leak unhandled rejections or uncaught exceptions.
skill_level: 2
invoke: inline
domain: api
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Error Handling Coverage Check Skill

**Question:** Do new async operations, external calls, and validation paths handle errors explicitly — with typed error responses and no unhandled rejections?

**Trigger:** Any change that adds async functions, external HTTP/DB calls, file I/O, or user-facing error responses.

## Checks

1. Every `await` in a request handler is inside a `try/catch` or a top-level error boundary — no unhandled promise rejections.
2. External API / DB call failures return a typed error response to the client (e.g. 4xx/5xx with structured body), not an unformatted exception.
3. Error handlers distinguish client errors (4xx) from server errors (5xx) — not all errors mapped to 500.
4. Validation errors return the failed fields in a structured format — not a raw `ZodError` stack trace.
5. Background jobs / queue workers have a catch block or dead-letter path — a thrown error is not silently swallowed.
6. Error logging is present for unexpected server errors (5xx) — the error is not only returned to the client.

## Output

- **PASS** — all new async paths have explicit error handling with typed responses.
- **FAIL(unhandled-rejection)** — async call without try/catch or boundary; escalate to `testing-agent` or inline-fix.
- **FAIL(raw-exception-response)** — unformatted exception returned to client; escalate to `security-agent` (information disclosure).
- **FAIL(missing-5xx-log)** — server error not logged; escalate to `observability-agent`.
- **FAIL(swallowed-error)** — error caught and ignored (empty catch); inline-fix or escalate to `testing-agent`.
- **N/A** — change does not add async operations or external calls.

## On FAIL

Fix `FAIL(unhandled-rejection)` and `FAIL(swallowed-error)` inline when obvious. Delegate `FAIL(raw-exception-response)` to `security-agent`. Delegate `FAIL(missing-5xx-log)` to `observability-agent`.

## Telemetry tags
- `skill_name:error-handling-coverage-check`
- `skill_level:2`
- `domain:api`
