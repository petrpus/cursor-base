# Repo Adoption Rule

When working in an unfamiliar area or when changing shared architecture, first adopt the current repository state.

**Primary project context lives in docs/ai.** Adoption must use docs/ai as the entry point:

1. Read **docs/ai/README.md** and **docs/ai/AGENT_ADOPTION.md**
2. Read **docs/ai/source-of-truth.md** to find authoritative docs for affected areas
3. Read relevant navigation docs in **docs/ai** (architecture-map, workflow, domain-map)
4. Then consult **docs/** and code as needed

Adoption should inspect existing implementation, conventions, wrappers, tests, and docs before proposing new patterns.

For UI/system work, use `ui-stack-adapter` first.
