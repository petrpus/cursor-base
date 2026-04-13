# Delegation metrics and governance scorecards

This file defines universal metrics for measuring delegation quality, efficiency, and governance adherence for repositories using this Cursor kit.

## Measurement sources

Primary:

- `tmp/chat-logs/machine/*.summary.json`
- `tmp/chat-logs/machine/*.jsonl` (event detail)

Secondary:

- task closeout reports following the delegation transparency rule

## Required per-task fields

Each non-trivial task closeout should include:

- `task_id`
- `risk_tier`
- `change_type`
- `delegated_agents[]`
- `skipped_specialists[]` with rationale
- `verification_outcome`
- `residual_risk`
- `budget_outcome` (within/exceeded + reason)

## Scorecard schema (periodic)

Minimum fields:

- period metadata (`period_start`, `period_end`, `timezone`)
- session volume/outcomes
- delegation depth/rate
- specialist compliance rate (required vs used)
- verification coverage and first-pass success
- retries and rework indicators
- token and cost indicators (including cached-token ratio)
- model-tier usage and policy violations
- risk-flag co-occurrence (e.g. database-migration without verification)
- logger health (missing sessionEnd, logger errors)

## Suggested SLO baselines

- >=95% L3/L4 tasks include required specialists
- >=90% non-trivial tasks include explicit residual-risk statement
- >=85% L2+ tasks pass verifier on first pass
- retries per successful task trend downward

Use these as starting baselines and tune per repository maturity.
