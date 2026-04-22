---
name: input-sanitization-check-skill
description: Check whether user-supplied inputs are validated and sanitized before use in queries, commands, or responses.
skill_level: 2
invoke: inline
domain: security
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: enumerated
---

# Input Sanitization Check Skill

**Question:** Are user-controlled inputs validated, typed, and sanitized before they reach sensitive sinks (SQL queries, shell commands, HTML output, file paths, external APIs)?

**Trigger:** Any change that handles user input from request bodies, query params, headers, form fields, file uploads, or webhook payloads.

## Checks

1. Inputs are parsed through a schema validator (e.g. Zod, Yup, Pydantic, Joi) before use — not just typed in TypeScript.
2. SQL/ORM queries use parameterized queries or the ORM's safe API — no raw string interpolation of user data.
3. HTML output that includes user data is escaped or uses a safe rendering API (e.g. React's JSX escaping) — no `dangerouslySetInnerHTML` with unescaped input.
4. File path operations derived from user input are validated against an allowlist or resolved relative to a safe base.
5. Shell commands do not interpolate user data directly; if unavoidable, input is strictly allowlisted.
6. Uploaded file types are validated server-side (not by extension alone).

## Output

- **PASS** — all input paths are validated and reach sinks through safe APIs.
- **FAIL(sql-injection)** — raw user data reaches a query string; escalate to `security-agent`.
- **FAIL(xss)** — unsanitized user data reaches HTML output; escalate to `security-agent`.
- **FAIL(path-traversal)** — user-controlled path is used without validation; escalate to `security-agent`.
- **FAIL(unvalidated-input)** — input reaches a sensitive sink without schema validation; escalate to `security-agent`.
- **N/A** — change does not handle user-controlled input.

## On FAIL

Delegate to `security-agent` with: the specific sink, the input source, and the FAIL code.

## Telemetry tags
- `skill_name:input-sanitization-check`
- `skill_level:2`
- `domain:security`
