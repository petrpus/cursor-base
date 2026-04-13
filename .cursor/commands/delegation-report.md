# /delegation-report

Generate a structured delegation effectiveness report from current task context and available logs.

## Required workflow
1. use `log-analyst-agent` to summarize delegation/tool/model/tokens/retries patterns from available summaries
2. use `compliance-verifier` to check whether required specialists and process gates were followed
3. synthesize into the standard Delegation Ledger format

## Required output
- task id/title
- risk tier and change type
- delegated agents and rationale
- accepted/rejected specialist recommendations
- skipped specialists and compensating controls
- verification summary
- residual risk
- time/tokens/cost summary (if available)
- governance follow-ups
