# Executive Summary: Universal Cursor Setup Improvement Program

## Purpose

Strengthen the universal `.cursor` setup so it delivers:

- higher code quality,
- more effective delegation to specialist agents,
- clear transparency on delegation outcomes and efficiency (time/tokens/cost),
- enterprise-grade governance and auditability.

This summary condenses the full plan in:
`tmp/universal-cursor-setup-improvement-plan.md`.

---

## Current state: what works well

- Broad specialist-agent coverage is already in place.
- Routing and verification intent are strong (orchestrator + verifier-first design).
- Hook-based telemetry already captures key operational signals:
  - delegations,
  - retries,
  - tools used,
  - tokens/cost (when available),
  - risk flags.
- Shared-vs-project documentation boundaries are clearly defined.

---

## Key issues to solve

1. **Policy inconsistency**  
   Commit behavior is contradictory across some rules and commands.

2. **Weak enforceability risk**  
   Guidance can become non-binding unless loaded as always-on rules or enforced by core orchestrator logic.

3. **No formal skills/playbooks layer**  
   Delegation quality depends heavily on free-form prompts instead of standardized reusable procedures.

4. **No model governance matrix**  
   Agent/model selection is not consistently constrained by risk and cost policy.

5. **No unified risk-gate matrix**  
   There is no single source of truth mapping risk level + change type -> required specialists + verification gates.

6. **Transparency not standardized**  
   Telemetry exists, but final reporting structure is not mandatory.

7. **L3/L4 governance hardening needed**  
   High-risk paths need explicit authority, signoff, and evidence requirements.

---

## Strategic recommendation

Adopt a **risk-tiered, matrix-driven delegation model** with mandatory closeout reporting.

### Core principle

Use delegation as a quality mechanism, not as a volume metric.  
Optimize for **quality-per-cost** and predictable delivery.

---

## Target operating model (non-trivial tasks)

1. Intake and risk triage (assign task ID, change type, risk tier)
2. Delegation planning (matrix + budget envelope)
3. Specialist review (parallel when independent)
4. Single-writer implementation phase
5. Risk-tiered verification and governance gates
6. Standardized closeout (delegation ledger + residual risk + efficiency)

---

## Top changes to implement

### 1) Governance and rule coherence

- Add an always-on **policy precedence rule**.
- Resolve commit-policy contradictions by explicit execution mode:
  - interactive (prepare-only),
  - autonomous cloud (commit/push allowed when environment requires it).
- Add always-on:
  - risk-tiering rule,
  - delegation-transparency rule,
  - parallel-delegation guardrails.

### 2) Skills/playbooks

Introduce reusable skills/playbooks for:

- risk triage,
- delegation planning,
- verification orchestration,
- security review,
- schema migration safety,
- API compatibility,
- docs sync,
- cost governance.

Each skill should emit standardized fields: assumptions, evidence, decision, risks, follow-ups.

### 3) Agent governance updates

Upgrade existing core agents first (before adding new agents):

- orchestrator (matrix + budgets + escalation),
- change-verifier (evidence-based pass/fail),
- compliance-verifier (mandatory for L4),
- docs-agent (governance/docs synchronization).

### 4) Model and budget policy

Define tiered model usage:

- Tier A (fast/low cost) for low-risk/repetitive analysis,
- Tier B (balanced) as default implementation/orchestration,
- Tier C (high-capability) for high-risk security/domain/data verification.

Require staged escalation (A -> B -> C) and rationale for budget overrun.

### 5) Transparency and metrics

Mandate a **Delegation Ledger** for non-trivial tasks:

- who was delegated,
- why,
- outcomes used/rejected,
- verification evidence,
- residual risk,
- token/cost/time summary.

Generate periodic governance scorecards from existing logs:

- specialist compliance rate,
- first-pass verifier success,
- retry/rework trend,
- cost/tokens per successful task,
- model-tier policy adherence.

---

## Enterprise security and compliance stance

For high-risk tasks:

- enforce mandatory security artifacts,
- require stronger L4 approvals and exception records,
- enforce telemetry hygiene (redaction, retention, controlled evidence storage),
- ensure compliance-verifier validates gates and waivers.

---

## Recommended rollout

### Phase 1: stabilize policy
- precedence, contradiction fixes, always-on risk/transparency rules.

### Phase 2: standardize execution
- unified risk matrix, skills/playbooks, model governance policy.

### Phase 3: optimize by evidence
- delegation/scorecard commands, KPI-driven tuning for quality-per-cost.

---

## Success criteria (program-level)

Program is successful when:

- policy conflicts are removed,
- risk-tier gate compliance is measurable and high,
- non-trivial tasks include standardized delegation closeout,
- verifier pass rates improve without uncontrolled token/cost growth,
- leadership can audit delegation effectiveness with minimal manual effort.

