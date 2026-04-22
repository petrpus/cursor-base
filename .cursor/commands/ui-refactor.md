# /ui-refactor

Run a safe UI refactor aligned with the repository's current design system and component architecture.

## Required workflow
1. confirm repository conventions from `docs/ai/ui-stack.md` and `docs/ai/design-system.md`
2. use `frontend-architecture-agent` for page or route structure
3. use `component-architect` when shared component APIs or extraction decisions are needed
4. use `ui-refactor-specialist` for the actual cleanup and normalization
5. use `design-system-guardian` if reusable rules change
6. use `design-token-auditor` if token normalization is involved
7. use `responsive-accessibility-auditor` for user-facing changes beyond **L1**-trivial (layout, a11y risk, or reflow)
8. use `testing-agent` if behavior changes or regression risk exists

## Final output
Report:
- what was refactored
- what was normalized
- what docs changed
- what debt remains
