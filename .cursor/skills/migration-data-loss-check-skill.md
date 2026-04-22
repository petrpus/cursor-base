---
name: migration-data-loss-check-skill
description: Check whether a database migration risks destroying or silently discarding existing data.
skill_level: 2
invoke: inline
domain: database
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Migration Data Loss Check Skill

**Question:** Does this migration risk permanently destroying or silently truncating existing data in production?

**Trigger:** Any migration that drops columns/tables, changes column types, removes enum values, or runs bulk UPDATE/DELETE statements.

## Checks

1. No `DROP COLUMN` or `DROP TABLE` without explicit confirmation that the data is no longer needed and has been backed up or soft-deleted.
2. Column type changes (e.g. VARCHAR → INT, TEXT → JSONB) include a data coercion step that handles existing values — and the coercion is reversible or has a fallback for invalid values.
3. Bulk UPDATE statements on large tables are batched or have a data-volume estimate — not a single unbounded UPDATE that locks the table.
4. Removing a foreign key relation does not orphan rows that the application still relies on.
5. Cascade delete rules are reviewed: adding ON DELETE CASCADE to an existing relation may silently delete child rows.
6. If data is being "migrated" to a new column, the source column is preserved until the new column is verified in production.

## Output

- **PASS** — migration does not risk data loss, or risk is bounded and documented.
- **FAIL(unguarded-drop)** — data dropped without backup/soft-delete confirmation; escalate to `database-agent`.
- **FAIL(unsafe-type-change)** — type coercion may silently discard values; escalate to `database-agent`.
- **FAIL(unbounded-bulk-op)** — bulk UPDATE/DELETE without batch strategy; escalate to `database-agent`.
- **FAIL(cascade-risk)** — cascade delete may silently remove dependent rows; escalate to `database-agent`.
- **N/A** — migration only adds columns/tables with no data modification.

## On FAIL

Delegate to `database-agent` with: the migration file, affected tables, estimated row counts if known, and the FAIL code.

## Telemetry tags
- `skill_name:migration-data-loss-check`
- `skill_level:2`
- `domain:database`
