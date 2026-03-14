# Repo Adoption Instruction

When the orchestrator decides a task touches architecture, shared patterns, or unknown project areas, it must first instruct the relevant agents to adopt the current repository state.

## Where project context lives

**Project-specific context is not in .cursor.** It lives in:

- **docs/ai/** — primary entry point (README, AGENT_ADOPTION, source-of-truth, architecture-map, workflow, domain-map, coding-rules)
- **docs/** — deep reference (see docs/ai/source-of-truth.md)

Adoption must use docs/ai (and then docs/) as the source of project knowledge; do not rely on .cursor/context for project-specific information.

## Mandatory adoption actions

- Read **docs/ai/README.md** and **docs/ai/AGENT_ADOPTION.md**, then **docs/ai/source-of-truth.md** and relevant docs/ai navigation docs
- Inspect the current file structure before proposing changes
- Identify current conventions instead of inventing new ones
- Prefer extending established patterns over introducing a parallel system
- Treat docs/ai and existing design-system docs (e.g. in .cursor/docs/ or docs/) as authoritative project context

## Important

This kit must not erase or replace existing design-system or project docs that were already generated elsewhere unless the task explicitly asks for that.
