# Delegation metrics and governance scorecards

Universal metrics for measuring delegation quality, efficiency, and governance adherence. **Reality check:** the hook writer only runs on `sessionStart` / `sessionEnd` (see `hooks.json`). Scorecards are only as good as the **payload Cursor sends** at `sessionEnd`.

## Measurement sources

**Primary (machine):**
- `tmp/chat-logs/sessions.jsonl` — one JSON line per `sessionEnd` (append-only)

**Secondary (human, authoritative for governance SLOs):**
- **Chat closeout** per `main-orchestration.mdc` (task_id, tier, `budget_outcome`, verification, residual risk) — this is the reliable source when JSONL fields are null.

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

**Usually reliable without runtime cooperation:** `session_id`, `chat_title`, `started_at`, `ended_at`, `duration_ms`, `model` (if present in hook payload), `tokens` and `cost_usd` **if** the runtime provides them in the `sessionEnd` stdin payload.

**Often empty unless the product populates `sessionEnd` JSON:** `risk_flags`, `agents_delegated`, `skills_invoked`, `verification_outcome`, `commits_prepared` — expect `[]` and `null` in practice. **Do not** run strict automated governance solely on these fields; use the **L2+ closeout** in the session transcript, or the `/metrics-report` command with manual interpretation.

The `/metrics-report` command still reads this file: treat analysis as **best-effort**; flag "unknown" where arrays are always empty.

## Required per-task closeout fields (L2+)

Per `main-orchestration.mdc`, each **L2+** final response should include: `task_id`, `risk_tier`, `change_type`, `delegated_agents[]` (in ledger), `skipped_specialists[]` with rationale when required specialists were not used, `verification_outcome`, `residual_risk`, and **`budget_outcome`**.

**L1** may use a minimal closeout (task, tier, change summary, verification, residual risk).

## Scorecard schema (periodic, produced by `/metrics-report`)

- Period metadata (`period_start`, `period_end`)
- Session volume and outcomes (from JSONL where fields exist)
- **Manual/cross-check:** closeout or transcript review for **tier** and **residual risk** (JSONL will not have these as structured fields today)
- Token and cost summary (when `tokens` / `cost_usd` present in JSONL)
- Logger health: missing `sessionEnd`, `_logger-errors.log` under `tmp/chat-logs/`

## Suggested SLO baselines (use closeouts, not only JSONL)

- ≥95% L3/L4 **tasks** (as stated in closeout) include required specialists
- ≥90% L2+ tasks include explicit **residual risk**
- ≥85% L2+ verifications pass on first try (as recorded in closeout)
- cached-token ratio trends (when `tokens` present in JSONL) upward as context stabilizes

Tune these per repository maturity.

## Default L2 plan-review shortlist (reference)

**Plan-review** (at least one run before implementation for L2) can be: **`orchestrator`**, or the best **area** match — e.g. `frontend-architecture-agent` (UI), `testing-agent` (test-heavy), `security-agent` (route/auth), `api-contract-agent` (contract surface) — with scope bundled in one call where possible. See `risk-tiering.mdc`.
