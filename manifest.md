# Cursor Kit Manifest

## Core workflow
- built-in Cursor Agent is the primary operator
- custom subagents live in `.cursor/agents/`
- rules force specialist consultation before risky work
- **project context**: agents use **docs/ai** as the primary project knowledge entry point (see `.cursor/context/project-docs-contract.md`)
- commands provide repeatable entrypoints
- hooks log agent activity for later analysis

## Key guarantees
- verification before commit recommendation
- commit hygiene after verification
- frontend specialist routing for pages, forms, tables, shared UI, and accessibility
- security and testing routing for behavior-sensitive work
- runtime operations routed through `.cursor/local/bin/`
