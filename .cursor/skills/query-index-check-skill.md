---
name: query-index-check-skill
description: Check whether new or modified query patterns have adequate index coverage.
skill_level: 2
invoke: inline
domain: database
default_model_tier: A
allowed_risk_tiers: [L2, L3, L4]
output_type: binary
---

# Query Index Check Skill

**Question:** Do new or modified database queries filter, sort, or join on columns that lack an index — making them likely to cause sequential scans at scale?

**Trigger:** Any change that adds or modifies database queries, ORM `where`/`orderBy`/`include` clauses, or raw SQL.

## Checks

1. Every new `WHERE` clause column (or compound condition) has a covering index in the schema or migrations.
2. Every new `ORDER BY` column that appears without a preceding equality filter has a matching index.
3. Join conditions use indexed columns on both sides where the joined table is large.
4. Queries that filter on non-indexed foreign keys are flagged (ORM includes without explicit `where` often become full scans).
5. New pagination patterns (cursor or offset) are on indexed columns — offset pagination on non-indexed columns degrades at depth.
6. If an index is added in this change, verify the column ordering matches the query's filter selectivity (high-selectivity columns first).

## Output

- **PASS** — all new query patterns have adequate index coverage.
- **FAIL(missing-filter-index)** — WHERE clause on unindexed column; escalate to `database-agent`.
- **FAIL(missing-sort-index)** — ORDER BY on unindexed column; escalate to `database-agent`.
- **FAIL(unindexed-join)** — join on unindexed column in large table; escalate to `database-agent`.
- **FAIL(pagination-risk)** — pagination on unindexed column; escalate to `database-agent`.
- **N/A** — change does not add or modify database queries.

## On FAIL

Delegate to `database-agent` with: the query, the table schema, and the FAIL code.

## Telemetry tags
- `skill_name:query-index-check`
- `skill_level:2`
- `domain:database`
