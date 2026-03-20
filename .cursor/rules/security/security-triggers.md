# Security Triggers

Use `security-agent` before implementation or finalization whenever a task affects:
- authentication
- authorization
- permissions
- loaders/actions
- route handlers
- uploads
- secrets
- admin-only flows
- sensitive data exposure
- session behavior
- background jobs with privileged effects

The agent must explicitly summarize security findings before considering the task complete.
