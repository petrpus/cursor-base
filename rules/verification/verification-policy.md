# Verification Policy

`change-verifier` is the final gate before commit recommendation.

## Default expectation
For normal implementation work, run verification at a level appropriate to the risk of the task.

## Minimum checks when relevant
- typecheck
- lint
- unit tests
- integration tests
- build

If full verification is intentionally skipped, the reason and risk must be stated explicitly.
