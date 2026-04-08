# Agent Topology

## How this works in practice
Cursor's built-in Agent is still the main actor. Custom subagents in `.cursor/agents/` are specialists the built-in Agent can delegate to. They are not a separate autonomous scheduler replacing the built-in agent.

That means:
- when you start a normal Agent task, the built-in Agent reads rules and may delegate to matching subagents
- when you use plan mode, the built-in Agent should still follow the same routing rules while planning
- commands make delegation more reliable by telling the built-in Agent exactly which specialists to call first

## Reliability levers
Delegation becomes much more consistent when all three are present:
1. strong rules with **must use** language
2. file-pattern triggers
3. commands that name the required specialists

For teams that want delegation "in the DNA", add a fourth lever:
4. mandatory post-task delegation reporting (who/why/outcome/checks)

## Custom subagents in this kit
- orchestrator
- implementation-agent
- change-verifier
- commit-agent
- frontend-architecture-agent
- design-system-agent
- ux-accessibility-agent
- security-agent
- testing-agent
- api-contract-agent
- database-agent
- observability-agent
- log-analyst-agent
- dev-runtime
- devops-agent
- domain-agent
- refactor-agent
- ui-stack-adapter
- component-architect
- design-system-guardian
- design-token-auditor
- responsive-accessibility-auditor
- ui-refactor-specialist
- docs-agent (documentation keeping; suited to cheap/fast model, run frequently)

## Important note
If a task is tiny and obviously local, Cursor may choose not to delegate. The setup below biases strongly toward delegation for non-trivial work, but cannot mathematically force every single task. The closest practical equivalent is strong routing plus verification gates.
