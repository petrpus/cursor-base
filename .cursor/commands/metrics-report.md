# /metrics-report

Generate a structured efficiency and governance scorecard from Cursor session logs. Delegates analysis to **`metrics-analyst-agent`**.

Use after a sprint, release, or any period you want to review. Also useful after onboarding a new team member to a Cursor-assisted repo.

## Required workflow

1. Delegate to **`metrics-analyst-agent`** with:
   - Log file path: `tmp/chat-logs/sessions.jsonl`
   - Analysis scope: the user-specified period (default: last 30 days), or all records if the log is small
   - Report type: general scorecard

2. **`metrics-analyst-agent`** produces the session analysis. The orchestrator then formats it as a final report.

3. If the agent finds governance gaps (L3/L4 sessions missing required specialists), surface them explicitly with specific session IDs or timestamps.

4. If the agent finds recurring skill FAIL patterns (same skill failing in ≥ 3 sessions), flag this as a systemic issue — either the skill check criteria are too strict, or the codebase has a real structural problem.

## Required report sections

```markdown
## Cursor Metrics Report — <period>

### Summary
| Metric | Value |
|--------|-------|
| Sessions analyzed | N |
| Total estimated cost | $X |
| Risk tier distribution | L1: N% / L2: N% / L3: N% / L4: N% |
| Average session duration | Xm |

### Delegation effectiveness
- Most-used agents (top 5 by session appearance)
- L3/L4 sessions missing required specialists (governance gaps)
- Sessions with no specialist delegation (review if appropriate for risk tier)

### Skill usage
- Top 5 triggered L2 skills (by FAIL count)
- Recurring FAIL patterns (same skill, 3+ sessions) — flag as systemic

### Cost analysis
- Highest-cost sessions (top 3 with context)
- Cost trend: up/down/flat vs. prior period (if prior data exists)
- Cached-token ratio (efficiency signal)

### Verification
- Verifier pass rate (sessions where verification_outcome = passed)
- Sessions with no verification record (potential governance gap)

### Recommendations (top 3)
1. <specific, actionable improvement>
2. ...
3. ...
```

## Guard rules

- If `sessions.jsonl` is empty or missing, report this clearly and suggest running a few sessions first.
- Do not invent data — if a field is null in the log, report it as unknown.
- Minimum meaningful analysis requires ≥ 10 sessions. With fewer, note the limited sample size.

## Output

The formatted report above, written to the chat response. Optionally save to `tmp/metrics-report-<date>.md` if the user wants a persistent copy.
