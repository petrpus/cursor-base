# /adopt-design-system

Adopt the repository's current UI system before broader UI work.

## Required workflow
1. use `ui-stack-adapter` first
2. inspect implementation, not just docs
3. update these canonical docs when needed (project docs in docs/ai; universal policy in .cursor/docs):
   - `docs/ai/design-system.md`
   - `docs/ai/ui-stack.md`
   - `docs/ai/ui-patterns.md`
   - `.cursor/docs/tooling-policy.md`
4. if shared component boundaries are involved, use `component-architect`
5. if governing UI rules changed, use `design-system-guardian`

## Output
Report:
- what the repo UI stack actually is
- what docs were updated
- which assumptions remain uncertain
