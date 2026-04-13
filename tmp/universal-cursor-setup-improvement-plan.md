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

## 6) Skills deep dive: architecture, assignment, and operating model

This section is intentionally detailed. It is the core mechanism for making existing agents faster, more predictable, and higher quality.

## 6.1 Why skills are the leverage point

Current agent capability is broad, but efficiency varies because execution is prompt-dependent.  
Skills convert ad hoc reasoning into reusable operating units with:

- deterministic triggers,
- fixed input/output contracts,
- explicit quality checks,
- model-tier guidance,
- measurable outcomes.

Practical impact:

- less repeated planning text,
- lower delegation ambiguity,
- better cross-agent consistency,
- easier verification and governance scoring.

## 6.2 Canonical structure and naming

Use `.cursor/skills/` as canonical location (or `.cursor/playbooks/` if naming separation is preferred).  
Recommended naming:

`<domain>-<action>-skill.md`

Examples:

- `risk-triage-skill.md`
- `delegation-planning-skill.md`
- `security-review-skill.md`
- `schema-migration-safety-skill.md`

Each skill should include frontmatter:

- `name`
- `description`
- `owner_agent`
- `secondary_agents`
- `default_model_tier`
- `allowed_risk_tiers`
- `required_inputs`
- `required_outputs`
- `version`

## 6.3 Skill definition contract (required sections)

Every skill file should contain these sections:

1. **Intent**
   - what decision/problem this skill solves.
2. **When to invoke**
   - trigger conditions (file patterns, task intent, risk tier).
3. **When not to invoke**
   - skip rules to avoid unnecessary cost.
4. **Inputs required**
   - task context, file list, constraints, risk tier, acceptance criteria.
5. **Procedure**
   - ordered execution steps.
6. **Output contract**
   - strict schema for downstream automation.
7. **Quality checklist**
   - objective pass criteria.
8. **Anti-patterns**
   - common failure modes.
9. **Model guidance**
   - default tier and escalation path.
10. **Telemetry tags**
   - tags to emit for scorecards.

## 6.4 Universal skill input contract

Main agent should pass this normalized payload to each skill invocation:

- `task_id`
- `task_title`
- `risk_tier` (L1-L4)
- `change_type` (ui/api/security/data/domain/docs/infra/mixed)
- `acceptance_criteria[]`
- `touched_files[]` (or expected scope)
- `constraints[]` (policy/stack/perf/security)
- `budget_envelope`:
  - `token_soft_limit`
  - `cost_soft_limit`
  - `latency_target`
- `known_uncertainties[]`
- `required_evidence_level` (light/standard/strict)

Why this matters: every downstream specialist receives comparable context, reducing re-questioning and noisy token spend.

## 6.5 Universal skill output contract

All skills should return machine-readable sections (markdown + structured block):

- `summary`
- `assumptions[]`
- `evidence_used[]`
- `findings[]`
- `decision`
- `recommendations[]`
- `risks[]` (with severity)
- `residual_risk`
- `follow_ups[]`
- `verification_needs[]`
- `budget_impact`:
  - `token_estimate`
  - `latency_impact`
  - `cost_impact`
- `confidence` (low/medium/high)

This enables the orchestrator, change-verifier, and compliance-verifier to evaluate outputs consistently.

## 6.6 Skill families and mandatory core set

Define skills in 5 families:

1. **Planning and control**
   - risk-triage
   - delegation-planning
   - conflict-resolution
   - budget-governance

2. **Engineering quality**
   - verification-orchestration
   - regression-risk-assessment
   - refactor-safety

3. **Security and compliance**
   - security-review
   - data-exposure-check
   - compliance-gate-evaluation
   - exception-waiver-recording

4. **Data and contracts**
   - schema-migration-safety
   - api-contract-compatibility
   - transaction-integrity-check

5. **UX and documentation quality**
   - ui-governance-audit
   - accessibility-flow-check
   - docs-sync
   - change-closeout-reporting

## 6.7 Agent-to-skill ownership matrix

Primary ownership (P) and supporting role (S):

| Skill | Orchestrator | Implementation | Change Verifier | Compliance Verifier | Security | Testing | Database | API Contract | Frontend Arch | Design System | UX/A11y | Docs | Log Analyst |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| risk-triage | P | S | S | S | S | S | S | S | S | S | S | S |  |
| delegation-planning | P | S |  | S | S | S | S | S | S | S | S | S |  |
| conflict-resolution | P | S | S | P | S | S | S | S | S | S | S | S |  |
| budget-governance | P | S |  | S |  |  |  |  |  |  |  |  | P |
| verification-orchestration | S | S | P | S | S | P | S | S | S | S | S |  |  |
| regression-risk-assessment | S | S | P |  | S | P | S | S | S | S | S |  |  |
| security-review | S |  | S | S | P |  | S | S |  |  |  |  |  |
| compliance-gate-evaluation | S |  | S | P | S |  | S | S |  |  |  |  |  |
| schema-migration-safety | S |  | S | S | S | S | P | S |  |  |  |  |  |
| api-contract-compatibility | S |  | S | S | S | S | S | P |  |  |  |  |  |
| ui-governance-audit | S |  | S |  |  | S |  |  | P | P | P |  |  |
| accessibility-flow-check | S |  | S |  |  | S |  |  | S | S | P |  |  |
| docs-sync | S |  |  | S |  |  |  |  |  |  |  | P |  |
| change-closeout-reporting | P |  | S | S |  |  |  |  |  |  |  | P | S |

Policy: every non-trivial task should map to at least one Planning skill + one domain skill + one closeout skill.

## 6.8 Mandatory skill bundles by risk tier

### L1 (low)

Required:

- risk-triage
- delegation-planning (light mode)
- change-closeout-reporting (compact)

Optional:

- docs-sync
- regression-risk-assessment

### L2 (moderate)

Required:

- risk-triage
- delegation-planning
- verification-orchestration
- regression-risk-assessment
- change-closeout-reporting

Conditional:

- ui-governance-audit (if UI surface touched)
- api-contract-compatibility (if API shape touched)

### L3 (high)

Required:

- all L2 required skills
- security-review
- compliance-gate-evaluation
- one of:
  - schema-migration-safety (data/migration path)
  - api-contract-compatibility (contract path)
  - ui-governance-audit + accessibility-flow-check (user-critical UI path)

### L4 (critical)

Required:

- all L3 required skills
- exception-waiver-recording (if any gate deviation)
- budget-governance (strict mode)
- change-closeout-reporting (strict mode)

And mandatory human approval checkpoint for residual risk acceptance.

## 6.9 Mandatory skill bundles by change type

Risk tier is primary; change-type bundle adds mandatory overlays:

- **Security-sensitive route/auth/upload/session**
  - security-review
  - compliance-gate-evaluation
  - verification-orchestration

- **Database schema/migrations**
  - schema-migration-safety
  - transaction-integrity-check
  - regression-risk-assessment

- **API schema/DTO/validation**
  - api-contract-compatibility
  - security-review
  - verification-orchestration

- **Shared UI/design system**
  - ui-governance-audit
  - accessibility-flow-check
  - docs-sync (if reusable conventions changed)

- **Docs/process/policy changes**
  - docs-sync
  - compliance-gate-evaluation
  - change-closeout-reporting

## 6.10 Skill invocation protocol (orchestrator algorithm)

For non-trivial tasks:

1. run `risk-triage-skill`,
2. run `delegation-planning-skill`,
3. generate skill bundle = required(risk tier) + required(change type),
4. split bundle into parallel-safe and serial groups,
5. execute read/review skills first,
6. synthesize findings and resolve conflicts,
7. run implementation,
8. run `verification-orchestration-skill`,
9. run change-verifier and (if needed) compliance-verifier,
10. run `change-closeout-reporting-skill`.

Stop conditions:

- unresolved high-severity conflict,
- required skill output missing,
- budget exhausted without acceptable confidence,
- L4 approval missing.

## 6.11 Skill-level model and budget policy

Each skill declares:

- default model tier (A/B/C),
- max allowed tier without explicit escalation reason,
- expected token range (light/standard/strict modes).

Example policy:

- `risk-triage`: Tier A default, Tier B for ambiguous mixed-scope tasks.
- `delegation-planning`: Tier B default.
- `security-review`: Tier B for L2; Tier C for L3/L4.
- `schema-migration-safety`: Tier B default; Tier C when destructive migration risk exists.
- `change-closeout-reporting`: Tier A default.

If a skill exceeds its token soft limit, it must emit:

- cause,
- whether escalation is necessary,
- lower-cost fallback path.

## 6.12 Skill quality controls and acceptance criteria

A skill definition is production-ready only when it passes:

1. **Clarity test**: another agent can run it without extra explanation.
2. **Determinism test**: same inputs produce materially similar outputs.
3. **Utility test**: outputs are actually consumed by orchestrator/verifier.
4. **Efficiency test**: lower rework or lower token burn vs baseline.
5. **Governance test**: emits required telemetry tags and closeout fields.

## 6.13 Skill telemetry and scorecard mapping

Each skill must emit telemetry tags:

- `skill_name`
- `skill_version`
- `skill_mode` (light/standard/strict)
- `skill_outcome` (pass/warn/fail)
- `skill_confidence`

Scorecard should track per skill:

- invocation count,
- median token/cost,
- contribution to verifier first-pass success,
- association with retry reduction,
- false-positive/low-value invocation rate.

This creates a feedback loop: keep high-value skills, redesign noisy ones.

## 6.14 Skills lifecycle governance

Introduce lifecycle states:

- `draft`
- `trial`
- `approved`
- `deprecated`

Promotion criteria:

- at least N successful uses (set per repo scale),
- stable output quality,
- measurable efficiency gain or quality gain.

Deprecation criteria:

- low adoption,
- high cost with low impact,
- duplicated by better skill.

## 6.15 First-wave implementation package (concrete)

Create these first 12 skill files:

1. `risk-triage-skill.md`
2. `delegation-planning-skill.md`
3. `verification-orchestration-skill.md`
4. `regression-risk-assessment-skill.md`
5. `security-review-skill.md`
6. `compliance-gate-evaluation-skill.md`
7. `schema-migration-safety-skill.md`
8. `api-contract-compatibility-skill.md`
9. `ui-governance-audit-skill.md`
10. `accessibility-flow-check-skill.md`
11. `docs-sync-skill.md`
12. `change-closeout-reporting-skill.md`

Then add 3 optional advanced skills in phase 2:

13. `conflict-resolution-skill.md`
14. `budget-governance-skill.md`
15. `exception-waiver-recording-skill.md`

## 6.16 Expected efficiency and quality gains from skills

Efficiency gains (target direction):

- lower planning token overhead via standardized inputs,
- fewer redundant delegations,
- fewer retry loops from missing specialist evidence,
- faster closeout generation through fixed output schema.

Quality gains (target direction):

- more consistent risk identification,
- higher specialist coverage where required,
- stronger verifier evidence quality,
- improved auditability and residual-risk clarity.

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

