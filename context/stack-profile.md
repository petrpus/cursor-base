# Stack Profile

Primary assumptions for repositories using this Cursor kit (no project-specific details; those live in docs/ai):
- Linux workstation, typically Fedora
- bash shell
- Node.js-based development workflow, Bun optional
- Vite application tooling
- TypeScript
- React
- React Router 7+
- Prisma 7+
- PostgreSQL
- Zod
- React Hook Form
- Tailwind CSS
- S3-compatible object storage, often MinIO locally
- BullMQ for jobs
- Vitest for unit and integration testing
- Playwright for end-to-end testing

Operational assumptions:
- verification flow matters more than agent autonomy
- commit hygiene matters
- local Cursor-only scripts should live under `.cursor/local/bin/`
- kit-internal docs (e.g. UI stack, tooling policy) live under `.cursor/docs/`; project knowledge lives in `docs/ai` and `docs/`
