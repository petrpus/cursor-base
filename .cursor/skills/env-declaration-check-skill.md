---
name: env-declaration-check-skill
description: Check whether new environment variables are declared in .env.example and validated at startup.
skill_level: 2
invoke: inline
domain: config
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Env Declaration Check Skill

**Question:** Are all new environment variables the application reads declared in `.env.example` (with safe placeholder values) and validated at startup?

**Trigger:** Any change that adds a new `process.env.*` / `os.environ[]` / `os.Getenv()` access, or adds a new entry to an env validation schema.

## Checks

1. Every new env var reference has a corresponding entry in `.env.example` (or equivalent) — even if the value is a placeholder like `YOUR_VALUE_HERE`.
2. Required env vars are validated at application startup (e.g. via Zod `z.string()`, `envalid`, or equivalent), not silently `undefined` at runtime.
3. The `.env.example` entry includes a comment explaining what the variable is for, if not self-evident.
4. If the variable holds a secret, `.env.example` shows a clearly fake placeholder — not an actual key pattern that could be confused for real.
5. `.env` is gitignored and `.env.example` is committed.
6. If the variable is optional, it has a default value in the validation schema — not just `process.env.X ?? undefined`.

## Output

- **PASS** — all new env vars are declared in `.env.example` and validated at startup.
- **FAIL(missing-env-example)** — new env var not in `.env.example`; inline-fix (add placeholder entry).
- **FAIL(no-startup-validation)** — env var read without validation schema; escalate to `devops-agent` or `implementation-agent`.
- **FAIL(real-secret-in-example)** — `.env.example` contains what looks like a real credential; escalate to `security-agent`.
- **N/A** — change does not add or modify env var references.

## On FAIL

Fix `FAIL(missing-env-example)` inline. Delegate `FAIL(no-startup-validation)` to implementation fix. Delegate `FAIL(real-secret-in-example)` to `security-agent` immediately.

## Telemetry tags
- `skill_name:env-declaration-check`
- `skill_level:2`
- `domain:config`
