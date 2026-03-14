# Project docs contract

**.cursor** is a **shared AI tooling layer**. It may be symlinked from a central repository and must not contain project-specific documentation.

## Separation of responsibilities

| Layer | Location | Contains |
| ----- | -------- | -------- |
| **Universal tooling** | `.cursor/` | Rules, agents, commands, and **generic** context only (stack baseline, adoption workflow, security/testing/domain triggers). No project-specific architecture, domain, or conventions. |
| **AI project knowledge** | `docs/ai/` | Project overview, architecture map, domain map, workflow, coding rules, adoption contract, source-of-truth — and **when to use the Domain Agent for this project**. |
| **Deep project docs** | `docs/` | Full authoritative documentation (architecture, database, security, jobs, etc.). |

- **Project knowledge** lives in **docs/ai** and **docs/**.
- **Project-specific information must not be stored in .cursor.** If it describes this codebase (e.g. domain concepts, product names, this app’s architecture), it belongs in docs/ai or docs/. See **docs/ai/SEPARATION.md** for the full boundary.
- **.cursor/context/** may contain only universal content; see **.cursor/context/README.md** for what is allowed here.

## Agent behaviour

Agents and rules must use **docs/ai** as the primary project context entry point: read docs/ai/README.md and docs/ai/AGENT_ADOPTION.md first, then docs/ai/source-of-truth.md and the relevant docs/ai navigation docs, then referenced files in docs/ as needed.
