---
name: n-plus-one-check-skill
description: Check whether new data-fetching patterns introduce N+1 query problems.
skill_level: 2
invoke: inline
domain: database
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# N+1 Query Check Skill

**Question:** Do new data-fetching patterns issue one query per item in a list, rather than fetching all related data in a single query?

**Trigger:** Any change that fetches a list of records and then accesses related data on each item (e.g. iterates results and calls `findOne`, `include`, or a resolver per item).

## Checks

1. Loops over query results do not contain nested `await db.find*(...)` calls — related data is fetched with `include`/`with`/`joinedLoad` in the parent query.
2. GraphQL resolvers that return lists use a DataLoader or batching mechanism for related fields — not a per-item resolver that issues its own query.
3. ORM lazy-loading is not used in code paths that iterate large collections (e.g. Prisma's `include` is explicit; implicit lazy-load APIs are avoided).
4. REST endpoints that return lists include related data via JOIN or `include` — not a separate per-item request to a sub-endpoint.
5. If the list size is bounded and small (e.g. always ≤ 5 items), document the bound; otherwise require batching.

## Output

- **PASS** — data fetching is batched; no N+1 pattern detected.
- **FAIL(loop-with-query)** — loop over results contains nested query calls; escalate to `database-agent`.
- **FAIL(unbatched-resolver)** — list resolver fetches related data per item without DataLoader; escalate to `database-agent`.
- **FAIL(lazy-load-in-loop)** — lazy-loaded relation accessed inside loop; escalate to `database-agent`.
- **N/A** — change does not add data-fetching over collections.

## On FAIL

Delegate to `database-agent` with: the loop or resolver code, the related entity fetched, and the FAIL code.

## Telemetry tags
- `skill_name:n-plus-one-check`
- `skill_level:2`
- `domain:database`
