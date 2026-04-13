# Cursor Kit Manifest

## Core workflow
- built-in Cursor Agent is the primary operator
- custom subagents live in `.cursor/agents/`
- rules force specialist consultation before risky work
- skills/playbooks in `.cursor/skills/` provide reusable, measurable execution units
- **project context**: agents use **docs/ai** as the primary project knowledge entry point (see `.cursor/context/project-docs-contract.md`)
- commands provide repeatable entrypoints
- hooks log agent activity for later analysis

## Key guarantees
- verification before commit recommendation
- commit hygiene after verification
- explicit policy precedence and conflict-handling behavior
- risk-tiered workflow with required specialist and verification gates
- frontend specialist routing for pages, forms, tables, shared UI, and accessibility
- security and testing routing for behavior-sensitive work
- runtime operations routed through `.cursor/local/bin/`
