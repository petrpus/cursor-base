# /governance-audit

Run a governance and delegation effectiveness audit for recent work.

## Required workflow
1. use `log-analyst-agent` to analyze session summaries and trend signals
2. use `compliance-verifier` to evaluate policy/routing/gate conformance
3. if L3/L4 security-sensitive work is in scope, include `security-agent`
4. produce a concise scorecard and concrete recommendations

## Required output
- policy conformance findings (pass/warn/fail)
- specialist-routing compliance summary
- verification and residual-risk coverage summary
- efficiency indicators (tokens/cost/retries/time) when available
- top 3 actions to improve quality-per-cost
