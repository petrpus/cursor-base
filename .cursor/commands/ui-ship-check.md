# /ui-ship-check

Run a final UI readiness check before merge.

## Required workflow
1. use `frontend-architecture-agent`
2. use `design-system-agent`
3. use `ux-accessibility-agent`
4. use `testing-agent`
5. use `change-verifier`

## Output
Return:
- pass
- pass with warnings
- fail
with a concise explanation.
