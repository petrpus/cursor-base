# Cursor Kit Manifest

## Core workflow
- built-in Cursor Agent is the primary operator; routing is by **L1–L4 risk tier** (not informal “size”)
- custom subagents live in `.cursor/agents/`
- path and glob **trigger rules** (`.cursor/rules/**/*.mdc`) load specialist mandates; **L2+** also uses a **plan-review** specialist; **L3 economy** (optional) reduces parallel fan-out without dropping mandatory verifiers
- skills/playbooks in `.cursor/skills/` provide reusable, measurable execution units
- **project context**: agents use **docs/ai** as the primary project knowledge entry point (see `.cursor/context/project-docs-contract.md`)
- commands provide repeatable entrypoints (e.g. `/ship`, `/metrics-report`)
- session hooks log to `tmp/chat-logs/sessions.jsonl` (fields vary by runtime payload; see `delegation-metrics.md`)

## Key guarantees
- verification before commit recommendation
- commit hygiene after verification
- explicit policy precedence and conflict-handling behavior
- **Session budget (L2+):** stop and ask before exceeding a declared token/cost/time envelope (`main-orchestration.mdc`)
- specialist matrix reference: `.cursor/docs/orchestration-routing.md`
- runtime operations routed through `.cursor/local/bin/`
