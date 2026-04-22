# /upgrade-deps

Upgrade project dependencies safely: identify outdated packages, assess risk per upgrade, apply safe upgrades, run verification, and prepare a clean commit. Delegates risk assessment and test verification to specialists.

## Required workflow

### 1. Identify outdated packages

Run the appropriate command for the detected package manager:

| Package manager | Discovery command |
|----------------|------------------|
| npm | `npm outdated --json` |
| pnpm | `pnpm outdated --format json` |
| yarn | `yarn outdated --json` (v1) or `yarn upgrade-interactive` output |
| pip / uv | `pip list --outdated` or `uv pip list --outdated` |
| poetry | `poetry show --outdated` |
| go | `go list -m -u all` |

Collect output and parse the package list. If the command fails or returns empty, report and stop.

### 2. Classify by upgrade risk

For each outdated package, assign a risk tier:

| Tier | Criteria |
|------|---------|
| **L1 — patch** | Semver patch bump (x.y.Z → x.y.Z+n). Expect backward compatible. |
| **L2 — minor** | Semver minor bump. Usually backward compatible; check changelog. |
| **L3 — major** | Major version bump. Breaking changes likely; requires investigation. |
| **L4 — critical dep** | Core runtime (Node, Python, Go), ORM, auth library, or security-flagged package. Always delegate to `security-agent`. |

Present the classified list to the user before applying anything. Ask for confirmation or let them scope the upgrade (e.g. "L1 only", "all except L3+").

### 3. Apply approved upgrades

Apply only packages in the approved scope:

```bash
# npm example (adapt per package manager)
npm update <pkg1> <pkg2>        # for patch/minor
npm install <pkg>@<new-version> # for specific version pins
```

For L3/L4 packages: **do not upgrade without user confirmation per package** and a `security-agent` check if applicable.

After applying, run a lockfile-only verification: ensure the lockfile changed and no unexpected packages were pulled in.

### 4. Verify

Delegate to **`change-verifier`** with a prompt to run the full check (type check, lint, test suite) against the post-upgrade working tree.

If tests fail:
- For test failures related to the upgraded package: delegate to **`testing-agent`** to adapt tests or fix compatibility issues.
- If the fix is **L2+** (e.g. breaking API, behavior change) or you cannot complete safely: revert the specific package and note it as "blocked" in the output.

Repeat until `change-verifier` passes or all failed packages are reverted/noted.

### 5. Commit

Delegate to **`commit-agent`** with:
- Scope: lockfile + `package.json` (or equivalent manifest) changes.
- Intent: dependency upgrade (list package names and version ranges in the message).
- Boundary: one commit per logical upgrade group (e.g. patch group, one per major upgrade).

Do not bundle unrelated code changes with dep upgrades.

## Guard rules

- Never apply L3/L4 upgrades without user confirmation.
- Always run `change-verifier` after applying; do not commit before it passes.
- Do not upgrade dev-only dependencies (e.g. `eslint`, `typescript`) in the same commit as runtime dependencies.
- If `npm audit` / `pip audit` shows vulnerabilities in the current deps, surface them even if not in the upgrade scope — delegate to `security-agent` for triage.

## Output

- **Upgrade summary table** — package, old version, new version, tier, result (applied / reverted / skipped).
- **Verifier result** — pass/fail per phase (type, lint, tests).
- **Commit plan** — boundaries and messages (awaiting user approval unless in autonomous mode).
- **Blocked upgrades** — packages not upgraded and why.
- **Security flags** — any audit findings surfaced during discovery or upgrade.
