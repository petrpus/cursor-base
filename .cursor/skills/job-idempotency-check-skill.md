---
name: job-idempotency-check-skill
description: Check whether new background jobs and queue tasks are idempotent — safe to run multiple times without duplicate side effects.
skill_level: 2
invoke: inline
domain: jobs
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Job Idempotency Check Skill

**Question:** Can this background job or queue task be safely retried or executed multiple times — producing the same result without duplicate side effects such as duplicate emails, double payments, or duplicate records?

**Trigger:** Any change that adds or modifies a background job, queue worker, scheduled task, or event handler.

## Checks

1. Duplicate-sensitive operations (send email, charge payment, create record) are guarded by an idempotency key or a database-level unique constraint checked before the operation.
2. If the job creates a record, it uses `upsert` or `findOrCreate` — not plain `create` which throws on a retry.
3. If the job sends an external notification (email, webhook, Slack), the sent state is persisted before returning success so a retry does not re-send.
4. If the job processes a queue message, acknowledging/committing the message happens only after all side effects succeed — not before.
5. Jobs that call external APIs with write operations (POST, PUT, DELETE) use the API's idempotency key header where supported.
6. The job handler function itself does not have global mutable state that accumulates across invocations.

## Output

- **PASS** — job is idempotent or has explicit duplicate-prevention guards.
- **FAIL(duplicate-write)** — record creation or external call not guarded against duplicates; escalate to `jobs-agent`.
- **FAIL(premature-ack)** — queue message acknowledged before side effects complete; escalate to `jobs-agent`.
- **FAIL(stateful-handler)** — global mutable state accumulates across invocations; escalate to `jobs-agent`.
- **N/A** — change does not add or modify background jobs or queue workers.

## On FAIL

Delegate to `jobs-agent` with: the job/worker code, the non-idempotent operation, and the FAIL code.

## Telemetry tags
- `skill_name:job-idempotency-check`
- `skill_level:2`
- `domain:jobs`
