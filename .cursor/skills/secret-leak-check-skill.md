---
name: secret-leak-check-skill
description: Check whether secrets, credentials, or sensitive data are at risk of leaking into logs, responses, or client bundles.
skill_level: 2
invoke: inline
domain: security
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Secret Leak Check Skill

**Question:** Does this change introduce any risk of secrets, credentials, tokens, or sensitive PII leaking into logs, error responses, client-side bundles, or version control?

**Trigger:** Any change that handles environment variables, auth tokens, API keys, passwords, user PII, or adds logging/error handling around sensitive operations.

## Checks

1. No secrets are hardcoded (no API keys, passwords, or tokens in source files or config committed to VCS).
2. Logging statements do not include full request bodies, tokens, passwords, or PII fields — only structured, safe identifiers (IDs, types, status codes).
3. Error responses to clients do not include stack traces, internal paths, or DB error messages in production paths.
4. `NEXT_PUBLIC_` / client-bundle env vars contain no secrets (applies to Next.js and similar frameworks with public/private env split).
5. New environment variables are referenced via `process.env.*` or equivalent — not inlined as literals.
6. `.env` and secret files are listed in `.gitignore`.

## Output

- **PASS** — no secret exposure risk detected.
- **FAIL(hardcoded-secret)** — a literal secret is in source code; escalate to `security-agent` immediately.
- **FAIL(log-exposure)** — sensitive data is logged; escalate to `security-agent`.
- **FAIL(client-bundle-leak)** — secret reaches a public bundle; escalate to `security-agent`.
- **FAIL(error-disclosure)** — internal details leak in error responses; escalate to `security-agent`.
- **N/A** — change does not touch secrets, credentials, PII, or logging.

## On FAIL

Delegate to `security-agent` with: the specific file/line, the leaking value type, and the FAIL code. Treat `FAIL(hardcoded-secret)` as a blocking issue regardless of risk tier.

## Telemetry tags
- `skill_name:secret-leak-check`
- `skill_level:2`
- `domain:security`
