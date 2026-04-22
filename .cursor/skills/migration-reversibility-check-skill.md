---
name: migration-reversibility-check-skill
description: Check whether a database migration can be safely rolled back without data loss or schema corruption.
skill_level: 2
invoke: inline
domain: database
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Migration Reversibility Check Skill

**Question:** Can this migration be rolled back cleanly — without data loss, schema corruption, or application downtime — if the deployment needs to revert?

**Trigger:** Any change that adds, modifies, or removes a database migration file.

## Checks

1. The migration does not DROP a column, table, or constraint without a corresponding "down" migration that restores it.
2. If a NOT NULL column is added, it either has a DEFAULT or the backfill is applied before the constraint — rollback is possible without data loss.
3. Renaming a column or table follows expand-contract (new column added, data migrated, old removed in a later migration) — not a single-step rename that breaks running app instances.
4. Enum value additions are backward-compatible (adding a value is safe; renaming or removing is not).
5. A down migration or rollback script exists and is non-empty when the ORM/tool supports it.
6. The rollback does not require manual data reconstruction (i.e. the dropped data is either still available via soft-delete or is confirmed disposable).

## Output

- **PASS** — migration is reversible or rollback impact is acceptable and documented.
- **FAIL(no-down-migration)** — up migration exists but no rollback path; escalate to `database-agent`.
- **FAIL(destructive-drop)** — DROP without verifiable rollback strategy; escalate to `database-agent`.
- **FAIL(single-step-rename)** — column/table rename without expand-contract pattern; escalate to `database-agent`.
- **FAIL(irreversible-constraint)** — NOT NULL or enum change not safely reversible; escalate to `database-agent`.
- **N/A** — change does not include migration files.

## On FAIL

Delegate to `database-agent` with: the migration file(s), FAIL code, and deployment rollback constraints.

## Telemetry tags
- `skill_name:migration-reversibility-check`
- `skill_level:2`
- `domain:database`
