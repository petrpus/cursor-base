# Observability Triggers

This file mirrors enforceable rule logic in `logging-triggers.mdc`.

Use `observability-agent` whenever a task affects:
- logging
- audit trails
- tracing
- metrics
- background jobs
- retries
- dead-letter behavior
- operational diagnosis

Use `log-analyst-agent` when the task is primarily about understanding recurring failures, churn, or workflow inefficiency from logs.
