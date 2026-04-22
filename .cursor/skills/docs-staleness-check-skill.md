---
name: docs-staleness-check-skill
description: Identify which documentation files are likely stale after this change and need updating.
skill_level: 2
invoke: inline
domain: documentation
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: enumerated
---

# Docs Staleness Check Skill

**Question:** Which `docs/ai/` pages, `README.md` files, or inline docstrings describe behavior that this change has modified — and are therefore likely to be stale?

**Trigger:** Every change that modifies public behavior, APIs, configuration, architecture, or domain rules.

## Checks

Map changed files to likely stale docs by convention:

| Changed area | Likely stale docs |
|-------------|-------------------|
| New API route or endpoint | `docs/ai/architecture-map.md`, `README.md` if public API |
| Database schema / migration | `docs/ai/architecture-map.md`, `docs/ai/domain-map.md` |
| Auth / permissions change | `docs/ai/AGENT_ADOPTION.md`, `docs/ai/coding-rules.md` |
| New env var or config | `docs/ai/dev-runtime.md`, `.env.example` |
| New script or make target | `docs/ai/dev-runtime.md`, `README.md` |
| Domain rule or business logic | `docs/ai/domain-map.md`, `docs/ai/workflow.md` |
| Testing approach change | `docs/ai/testing.md` |
| Infra / CI change | `docs/ai/dev-runtime.md`, `docs/ai/workflow.md` |
| New dependency added | `docs/ai/stack.md` |
| UI component / design | `docs/ai/design-system.md`, `docs/ai/ui-patterns.md` |

1. Identify which rows above match the change's touched files.
2. Check if the matched doc files exist and when they were last updated relative to the code change.
3. Read only the relevant section of each matched doc file — do not load the full doc unless necessary.

## Output

- **PASS** — no docs appear stale, or docs were already updated in this change.
- **WARN(stale-docs)** — list specific docs files and sections likely needing update; pass to `docs-agent`.
- **N/A** — change is internal refactor with no behavioral or API surface change.

## On WARN

Pass the stale doc list to `docs-agent` with: which files are stale and what changed in the code. This is an input to `docs-sync-skill`, not a replacement for it.

## Telemetry tags
- `skill_name:docs-staleness-check`
- `skill_level:2`
- `domain:documentation`
