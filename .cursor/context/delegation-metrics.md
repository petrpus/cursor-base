# Delegation metrics and governance scorecards

Universal metrics for measuring delegation quality, efficiency, and governance adherence.

## Measurement sources

Primary:
- `tmp/chat-logs/sessions.jsonl` — one complete JSON record per session (append-only)

Secondary:
- task closeout reports in `tmp/` following the closeout requirements in `main-orchestration.mdc`

## Session record schema (`sessions.jsonl`)

Each line is a complete JSON object written at `sessionEnd`:

```json
{
  "session_id": "string",
  "chat_title": "string",
  "started_at": "ISO 8601",
  "ended_at": "ISO 8601",
  "duration_ms": "number",
  "model": "string | null",
  "tokens": { "input": "number | null", "output": "number | null", "cached": "number | null" },
  "cost_usd": "number | null",
  "status": "string",
  "risk_flags": ["string"],
  "agents_delegated": ["string"],
  "skills_invoked": ["string"],
  "verification_outcome": "string | null",
  "commits_prepared": "number | null"
}
```

Notes:
- `agents_delegated`, `skills_invoked`, `verification_outcome`, and `commits_prepared` are populated only when the session end payload from the runtime provides them; otherwise they are empty arrays / null.
- The `/metrics-report` command reads this file and produces a scorecard. See `.cursor/commands/metrics-report.md`.

## Required per-task closeout fields

Each non-trivial task closeout (in the final chat response) must include:

- `task_id`
- `risk_tier`
- `change_type`
- `delegated_agents[]`
- `skipped_specialists[]` with rationale
- `verification_outcome`
- `residual_risk`
- `budget_outcome` (within / exceeded + reason)

## Scorecard schema (periodic, produced by `/metrics-report`)

- Period metadata (`period_start`, `period_end`)
- Session volume and outcomes
- Delegation rate by risk tier
- Specialist compliance rate (required vs used)
- Verification coverage and first-pass success rate
- Token and cost summary (including cached-token ratio)
- Risk-flag frequency
- Logger health (missing sessionEnd events, logger errors)

## Suggested SLO baselines

- ≥95% L3/L4 tasks include required specialists
- ≥90% non-trivial tasks include explicit residual-risk statement
- ≥85% L2+ tasks pass verifier on first try
- Cached-token ratio trends upward as session context stabilizes

Tune these baselines per repository maturity.
