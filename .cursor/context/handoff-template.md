# Handoff Template

Use this template when handing off an in-progress task to another session, agent, or human collaborator. A good handoff eliminates the need for the receiver to reconstruct context from scratch.

Copy and fill in the relevant sections. Omit sections that are N/A for your task.

---

## Task handoff: <task title>

**Task ID:** `<task_id>`
**Risk tier:** L1 / L2 / L3 / L4
**Change type:** ui / api / security / data / domain / docs / infra / mixed
**Status:** in-progress / blocked / needs-review

### What was done

_Bullet list of completed steps. Be specific — include file names, commands run, and decisions made._

- [ ] <step 1>
- [x] <step 2> — completed; result was X
- [x] <step 3> — completed

### What remains

_Ordered list of remaining steps. Include the first concrete action the receiver should take._

1. <next action> — requires reading `<file>` first
2. <subsequent action>
3. ...

### Key decisions made

_Decisions the receiver must know to avoid re-doing the analysis. Include the rationale._

| Decision | Rationale | Alternative considered |
|----------|-----------|----------------------|
| <decision> | <why> | <what was rejected> |

### Specialist routing already done

| Specialist | Delegated for | Outcome |
|-----------|--------------|---------|
| `<agent>` | <purpose> | <finding/recommendation used> |

### Specialists still needed

| Specialist | Why | Input to provide |
|-----------|-----|-----------------|
| `<agent>` | <what for> | <what context to give them> |

### Known risks / blockers

_Things the receiver should watch out for. Include any unresolved specialist conflicts._

- <risk or blocker>

### Verification status

- [ ] `change-verifier` run — result: <pass / fail / not run>
- [ ] `commit-agent` consulted — result: <proposed plan / not consulted>
- Residual risk: <explicit statement or "not assessed">

### Open questions

_Questions that need answering before the task can close. Mark the owner if known._

- [ ] <question> — owner: <human / agent / unassigned>

### Relevant files

_Files that are directly relevant to the remaining work. Not a full file list — just what the receiver needs to read first._

- `<path>` — <why relevant>
- `<path>` — <why relevant>

---

**Handoff created by:** <session / agent / human>
**Handoff created at:** <ISO date>
**Target receiver:** <agent name / human / any>
