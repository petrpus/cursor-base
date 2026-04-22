---
name: job-failure-handling-check-skill
description: Check whether new background jobs handle failures with retry strategy, dead-letter routing, and alerting.
skill_level: 2
invoke: inline
domain: jobs
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Job Failure Handling Check Skill

**Question:** Does this background job define a retry strategy, a dead-letter queue (DLQ) path, and failure alerting — so that transient failures are retried and permanent failures are surfaced?

**Trigger:** Any change that adds or modifies a background job, queue worker, or scheduled task definition.

## Checks

1. A retry count or backoff strategy is configured — the job does not fail permanently on first error without a retry attempt.
2. A maximum retry limit is set — jobs do not retry infinitely on permanent errors (e.g. invalid input, missing record).
3. After maximum retries, the job moves to a DLQ or an error record is persisted — it is not silently dropped.
4. An alert or monitoring hook fires when jobs consistently fail or the DLQ depth exceeds a threshold.
5. Errors are logged with job ID, input context (non-sensitive), and stack trace — not swallowed in an empty catch.
6. Timeout is configured for jobs that call external services — no job can block a worker thread indefinitely.

## Output

- **PASS** — retry strategy, DLQ path, and failure logging are all present.
- **FAIL(no-retry)** — job has no retry configuration; escalate to `jobs-agent`.
- **FAIL(infinite-retry)** — retry limit is missing or unbounded; escalate to `jobs-agent`.
- **FAIL(no-dlq)** — no dead-letter path after max retries; escalate to `jobs-agent`.
- **FAIL(swallowed-error)** — job errors not logged; escalate to `observability-agent`.
- **FAIL(no-timeout)** — external call in job has no timeout; escalate to `jobs-agent`.
- **N/A** — change does not add or modify background job definitions.

## On FAIL

Delegate to `jobs-agent` with: the job definition code, queue config, and FAIL code. Delegate `FAIL(swallowed-error)` to `observability-agent`.

## Telemetry tags
- `skill_name:job-failure-handling-check`
- `skill_level:2`
- `domain:jobs`
