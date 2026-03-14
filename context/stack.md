# Stack Baseline

- OS baseline: Linux desktop, Fedora, bash shell.
- Runtime baseline: Node.js application stack, Bun optional when explicitly chosen.
- Frontend baseline: TypeScript, React, React Router 7+, Tailwind.
- Forms baseline: React Hook Form + Zod.
- Data baseline: Prisma 7+, PostgreSQL.
- Storage baseline: S3-compatible object storage, MinIO for local compatibility.
- Jobs baseline: BullMQ.
- Testing baseline: Vitest for unit/integration, Playwright for end-to-end.

All agents should assume strict TypeScript and avoid `any`.
