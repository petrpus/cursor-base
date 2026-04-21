# /ship

Run the full **code → verify → docs → commit → PR** pipeline for the current working tree. Delegates each phase to the appropriate specialist to maximize correctness without requiring manual orchestration.

Use after completing a feature or fix. Not a substitute for running tests yourself during development — `/ship` is the final quality gate before merge.

## Required workflow

### Phase 1 — Audit and pre-flight (parallel)

Delegate in parallel:
- **`change-verifier`**: run lint, type check, and tests on all staged/unstaged changes. Collect findings.
- **`audit`** (inline): if `.cursor/.cursor-kit-managed.json` exists, run `cursor-kit audit --project .` and collect any broken references.

Do **not** proceed to Phase 2 until both complete. If `change-verifier` reports failures, continue to Phase 2 (fix) instead of Phase 3.

### Phase 2 — Fix (when Phase 1 finds errors)

For each class of error:

| Error type | Specialist |
|-----------|-----------|
| Test failures | **`testing-agent`** |
| Type errors / lint | **`code-reviewer`** inline (fix in place) |
| Security findings | **`security-agent`** |
| Broken cursor references (`-agent`/`-skill`) | inline fix in the referencing file |

After fixes, re-run `change-verifier` to confirm green. Do not proceed until the verifier passes.

### Phase 3 — Documentation (parallel)

Delegate in parallel:
- **`docs-agent`**: update `docs/ai/` pages that reflect the changed code (architecture, domain, workflow, stack if changed). Do not touch pages that are unrelated to this change.
- If the change includes new UI components or patterns: **`design-system-agent`** to update `docs/ai/design-system.md` / `ui-patterns.md`.

Collect output and apply recommended doc changes.

### Phase 4 — Commit

Delegate to **`commit-agent`** with:
- The full diff scope (original changes + any fixes from Phase 2 + doc updates from Phase 3).
- Intent: `ship` (implies clean boundaries, complete scope, ready-to-merge quality).
- Mode: interactive (present proposed commit plan for user approval) unless running in autonomous cloud mode with explicit commit policy.

**Boundary guidance for commit-agent:**
- Group functional changes, test fixes, and doc updates into logical commit boundaries (not one giant commit unless the scope is small).
- Do not include unrelated files.

### Phase 5 — PR (optional, ask if not clear from context)

If the user asked to ship to a remote branch or open a PR:
1. Confirm the target branch with the user if not obvious.
2. Run `cursor-kit diff --project .` to surface any locally modified managed files that should go upstream first.
3. Use `gh pr create` (or display the command for the user to run) with a structured body:
   - **Summary** (bullet list of what changed)
   - **Test plan** (how to verify)
   - **Risks / follow-ups** (anything not in scope)
4. Mention `cursor-kit propose-upstream --description "..."` if managed files were modified and should flow back to cursor-base.

## Guard rules

- Never skip Phase 1 (`change-verifier`). A green verifier is a hard gate.
- Never skip `commit-agent` before any mutating git operation.
- `/ship` is not valid while Phase 2 fixes are incomplete. Complete fixes first.
- If `change-verifier` is unavailable, surface this as a blocker and stop.

## Output

- **Phase 1 result** — verifier pass/fail, audit findings.
- **Phase 2 summary** — what was fixed and by which specialist (if applicable).
- **Phase 3 summary** — doc pages updated.
- **Phase 4 plan** — proposed commits (boundaries + messages) awaiting approval.
- **Phase 5 action** — PR URL or command to run (if requested).
