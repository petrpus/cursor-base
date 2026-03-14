# Database Triggers

Use `database-agent` whenever a task affects:
- `schema.prisma`
- migrations
- Prisma queries with changed shape or filters
- transaction boundaries
- indexes
- relation semantics
- performance-sensitive data access

Database-sensitive changes should not be finalized without a database review summary.
