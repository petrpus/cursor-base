# Universal Cursor Setup Improvement and Extension Plan

## 1) Goal and constraints

This plan improves the universal `.cursor/` kit to maximize:

1. effective delegation (specialists used when they materially improve outcomes),
2. delivered quality (verification + risk controls),
3. transparency (who was delegated, why, and with what efficiency),
4. enterprise readiness (policy coherence, auditability, controlled autonomy).

Scope: rules, agents, commands, telemetry, and governance process.  
Constraint: no product-code changes.

---

## 2) Current-state assessment

### Strengths

- Mature specialist set in `.cursor/agents/` with clear responsibility boundaries.
- Existing routing intent in orchestration and trigger rules.
- Verifier-first posture (`change-verifier` + verification policy).
- Strong telemetry base via hooks + logger (`tmp/chat-logs`) with:
  - delegations
  - tools
  - retries
  - tokens/cost (when emitted)
  - risk flags
  - summary artifacts
- Clean shared-vs-project context contract (`.cursor/context/project-docs-contract.md`).

### Gaps and risks

1. **Policy conflicts:** commit behavior is contradictory across rules and commands.
2. **Rule enforceability risk:** proposed `.md` guidance can be inert if not loaded as `alwaysApply` or orchestrator-enforced.
3. **No formal reusable skill/playbook layer:** behavior is prose-heavy and less measurable.
4. **No explicit model governance matrix:** cost/capability decisions are inconsistent.
5. **No unified risk x change-type x gate matrix:** triggers exist, but no single execution truth table.
6. **Adoption fallback ambiguity:** docs-first rules can dead-end when `docs/ai` is missing.
7. **Transparency not standardized:** telemetry exists, but no mandated final ledger schema.
8. **Security governance incompleteness:** L3/L4 controls lack role-based signoff and strict evidence contracts.

---

## 3) Specialist review synthesis (plan QA)

Relevant specialist reviews were performed on the draft plan:

- **compliance-verifier:** flagged precedence and enforceability issues.
- **orchestrator:** requested explicit handoff contracts, concurrency rules, and stop conditions.
- **log-analyst-agent:** requested measurable KPI schema tied to existing logger data.
- **security-agent:** requested stricter L3/L4 authority, evidence, and telemetry hygiene controls.

This final plan incorporates those recommendations.

---

## 4) Enterprise operating model (main agent)

For all non-trivial tasks, adopt this 6-stage model:

1. **Intake & triage**
   - assign `task_id`
   - classify change type (UI/API/security/data/domain/docs/infra)
   - assign risk tier (L1-L4, highest tier wins)
   - define acceptance criteria

2. **Plan & delegation design**
   - produce a delegation matrix from risk + change type
   - identify parallelizable specialist batch(es)
   - declare budget envelope (token/cost/time soft limits)

3. **Specialist review phase**
   - run read/review specialists first where possible
   - require structured outputs (findings, risks, recommendations)
   - maintain conflict log if specialist outputs diverge

4. **Implementation phase (single-writer default)**
   - one writer agent applies code/doc edits per phase (typically implementation-agent or main agent)
   - other specialists remain advisory unless explicitly assigned to write in isolated scope

5. **Verification & governance gates**
   - run risk-tiered verification
   - run `change-verifier` as last technical gate
   - run `compliance-verifier` for L4 and policy-sensitive work

6. **Closeout & learning**
   - emit standard delegation ledger + residual risk summary
   - capture budget outcomes and governance metrics inputs

---

## 5) Rule system improvements

## 5.1 Add precedence rule (always apply)

Create `.cursor/rules/01-policy-precedence.mdc` (`alwaysApply: true`) with explicit order:

1. user instruction for this session,
2. system/environment constraints,
3. repository `alwaysApply` rules,
4. task-specific applied rules,
5. command playbooks,
6. agent-local guidance.

If same-level conflict occurs, choose stricter safety constraint and report conflict.

## 5.2 Resolve commit-policy contradiction

Normalize commit behavior by execution mode:

- **interactive mode (human approval expected):** prepare commit boundaries/messages only.
- **autonomous cloud mode (explicit environment requirement):** allow commit/push per runtime policy.

Add this explicitly to commit policy and the pre-commit command so both documents agree.

## 5.3 Risk-tiering as an enforceable matrix

Add `.cursor/rules/orchestration/risk-tiering.mdc` (`alwaysApply: true`) with:

- tier definitions (L1-L4),
- highest-tier-wins rule,
- required specialists,
- required verification depth,
- required approval/signoff conditions.

## 5.4 Delegation transparency rule

Add `.cursor/rules/orchestration/delegation-transparency.mdc` (`alwaysApply: true`) requiring final report sections:

- delegation ledger,
- skipped-specialist justification,
- conflict-resolution decisions,
- verification evidence,
- residual risk statement,
- token/cost/time summary (if available).

Temporary governance artifacts should live in `tmp/` (aligned with existing `plans-in-tmp` rule).

## 5.5 Bounded adoption fallback when `docs/ai` is missing

Amend adoption rule to avoid random scans:

1. read project-docs contract + universal context,
2. read root README and task-referenced files,
3. inspect only narrowly targeted code/doc paths,
4. emit adoption gaps in `tmp/`,
5. only create/expand `docs/ai` when task scope explicitly includes docs bootstrapping.

## 5.6 Parallel delegation with guardrails

Add `.cursor/rules/orchestration/parallel-delegation.mdc`:

- parallelize only independent specialties,
- no overlapping write ownership in same batch,
- security-sensitive conflicts must be resolved before implementation proceeds,
- do not exceed budget envelope without rationale.

---

## 6) Skills (or playbooks) extension

Introduce a reusable library under either:

- `.cursor/skills/` (if you want direct skill terminology), or
- `.cursor/playbooks/` (to avoid confusion with platform-native “Skills”).

Each skill/playbook should define:

- trigger conditions,
- required inputs,
- expected output schema,
- quality checklist,
- anti-patterns,
- recommended model tier.

### Priority initial skills/playbooks

1. risk-triage
2. delegation-planning
3. verification-orchestration
4. security-review
5. schema-migration-safety
6. api-contract-compatibility
7. ui-governance-audit
8. docs-sync
9. cost-governance
10. post-task-retrospective

### Standard output schema

- `assumptions`
- `evidence_used`
- `decision`
- `risks`
- `follow_ups`
- `effort_impact` (qualitative)

---

## 7) Agent updates and additions

## 7.1 Upgrade existing agents

- **orchestrator**
  - must output risk tier + delegation matrix + budget envelope
  - must define escalation/stop conditions
  - must assign a single writer for implementation phase

- **change-verifier**
  - enforce matrix-derived required-specialist coverage
  - require evidence checklist and residual-risk grading
  - output pass / pass-with-warnings / fail with reasons

- **compliance-verifier**
  - mandatory for L4 and governance/policy changes
  - validate precedence compliance and gate completion
  - validate exception handling (waivers, approvals, expiry)

- **docs-agent**
  - include delegation outcome documentation for major tasks
  - keep governance docs and commands synchronized

## 7.2 New-agent recommendation policy

Start without new permanent agents. Fold these responsibilities first into existing agents:

- delegation auditing -> compliance-verifier + log-analyst-agent
- cost efficiency analysis -> log-analyst-agent
- policy conflict resolution -> compliance-verifier

Add dedicated agents only if metrics prove sustained load/benefit.

---

## 8) Model restrictions and budget governance

Create `.cursor/context/model-governance.md` with tier policy.

### Tier A (fast/low cost default)

- docs-agent
- log-analyst-agent
- design-token-auditor
- responsive-accessibility-auditor
- dev-runtime for routine checks

### Tier B (balanced default)

- orchestrator
- implementation-agent
- refactor-agent
- frontend-architecture-agent
- design-system-agent

### Tier C (high-capability reserved)

- security-agent (L3/L4)
- domain-agent (high-risk domain changes)
- api-contract-agent (breaking/complex contract risk)
- database-agent (migration or performance-sensitive DB work)
- change-verifier for L3/L4
- compliance-verifier for L4

### Escalation and budget rules

1. staged escalation: A -> B -> C only when unresolved risk remains,
2. soft budget per risk tier with “exceeded budget” rationale requirement,
3. model-tier violations must be recorded in closeout,
4. prohibit sensitive secret/data exposure in prompts regardless of tier.

---

## 9) Security and compliance hardening (enterprise)

## 9.1 Authority and approval model (RACI+)

- Responsible: implementation/main agent
- Accountable: orchestrator/main agent
- Consulted: required specialists from matrix
- Informed: governance logs/docs
- **Approver (L4):** named human role for residual risk acceptance

## 9.2 Mandatory gates for high-risk work

### L3 minimum

- security specialist review artifact,
- mapped verification for security-sensitive behavior,
- residual risk statement.

### L4 minimum

- all L3 gates +
- compliance-verifier run,
- independent second security review path (human or separate security authority),
- explicit approval for residual-risk acceptance with expiry,
- break-glass path recording if any gate is bypassed.

## 9.3 Telemetry hygiene requirements

- redact secrets/PII in logs and reports,
- classify governance artifacts,
- define retention for chat/governance logs,
- maintain tamper-evident or controlled storage for compliance evidence.

---

## 10) Delegation transparency and effectiveness metrics

Build on `tmp/chat-logs/machine/*.summary.json` + jsonl event stream.

## 10.1 Per-task delegation ledger (required)

- task ID/title
- risk tier + change type
- delegated agents and rationale
- accepted/rejected recommendations
- skipped specialists + compensating controls
- verification outcomes
- residual risk
- token/cost/time summary (if available)

## 10.2 Governance scorecard schema (periodic)

Required fields:

- period metadata (`period_start`, `period_end`)
- session volume/outcomes
- by risk tier and task class
- delegation metrics (rate, depth, compliance vs expected matrix)
- verification metrics (coverage, first-pass success, rework cycles)
- efficiency metrics (tokens, cached ratio, cost, tool intensity)
- risk exposure metrics (`riskFlags` co-occurrence, e.g. migration without verification)
- model governance metrics (tier usage and violations)
- logger health metrics (missing session end, logger errors)

## 10.3 Example SLO targets

- >=95% L3/L4 tasks include required specialists
- >=90% non-trivial tasks include explicit residual risk statement
- >=85% verifier first-pass success for L2+
- downward trend in retries per successful task

---

## 11) Standardized closeout template (main agent)

Use this structure for non-trivial tasks:

1. Task summary (ID, risk tier, change type, acceptance criteria)
2. Plan/scope (what changed, deferred scope, assumptions)
3. Delegation ledger table
4. Skipped specialists and rationale
5. Conflicts and decisions
6. Verification evidence + change-verifier result
7. Residual risk statement
8. Cost/time/tokens and budget conformance
9. Follow-ups

---

## 12) Implementation roadmap

## Phase 1: policy coherence and enforceability

1. Add precedence rule (`alwaysApply`).
2. Resolve commit-policy contradiction by mode.
3. Add risk-tiering + delegation-transparency rules (`alwaysApply`).
4. Add bounded docs/adoption fallback.

## Phase 2: matrix, skills/playbooks, model policy

1. Create unified risk x change-type x specialist x verification matrix.
2. Introduce initial skills/playbooks with output schema.
3. Add model-governance policy and update core agents to reference it.

## Phase 3: metrics and optimization

1. Add delegation-report/governance-audit command(s).
2. Generate periodic scorecard from logger outputs.
3. Tune routing and model tiers based on measured quality-per-cost.

---

## 13) Suggested file-level changes (future PR scope)

### New rules

- `.cursor/rules/01-policy-precedence.mdc`
- `.cursor/rules/orchestration/risk-tiering.mdc`
- `.cursor/rules/orchestration/delegation-transparency.mdc`
- `.cursor/rules/orchestration/parallel-delegation.mdc`

### New context

- `.cursor/context/model-governance.md`
- `.cursor/context/delegation-metrics.md`

### New reusable guidance

- `.cursor/skills/*.md` or `.cursor/playbooks/*.md`

### New commands

- `.cursor/commands/governance-audit.md`
- `.cursor/commands/delegation-report.md`

### Agent updates

- orchestrator
- change-verifier
- compliance-verifier
- docs-agent

---

## 14) Definition of done

This improvement program is complete when:

1. Policy precedence is explicit and contradictions are removed.
2. Risk-tiered matrix gating is active and auditable.
3. Skills/playbooks are standardized and referenced in orchestration.
4. Model restrictions and budget policy are consistently applied.
5. Delegation transparency ledger is present in non-trivial task closeout.
6. Governance scorecards show stable/improved quality-per-cost.

---

## 15) Adoption notes

- Preserve fast lane for L1/L2 tasks to avoid unnecessary bureaucracy.
- Apply strict controls to L3/L4 tasks where enterprise risk justifies overhead.
- Optimize for **quality-per-cost** and predictability, not delegation volume.

