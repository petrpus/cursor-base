# /adopt-cloud-env

Prepare **`.cursor/environment.json`** for **Cursor Cloud agents**: reproducible install, optional Docker Compose bring-up, and an **`env` block that contains only safe, non-secret literals**. After applying changes, output a **checklist of variable names** the user must define in **Cursor Secrets** (dashboard) so agents receive passwords, tokens, and full connection strings at runtime.

This command does **not** run `cursor-kit` and does not modify shared symlinked `.cursor` content. It only edits **repo-local** files under `.cursor/` and may update **`docs/ai/dev-runtime.md`** when needed for alignment.

**Official reference:** [Cursor Cloud Agent setup](https://cursor.com/docs/cloud-agent/setup) — follow the current documented schema for `environment.json` (`install`, `start`, `terminals`, `env`, `build`, etc.). If Cursor’s schema differs from the examples below, **prefer Cursor’s docs**.

## Safety rules (non-negotiable)

1. **Never** write API keys, passwords, private keys, MinIO root keys, production URLs, or real `DATABASE_URL` / `TEST_DATABASE_URL` values into committed `environment.json`.
2. **Safe to hardcode** in `env` (examples — adjust to your repo):
   - Flags and modes: `NODE_ENV=development`, `CI=true` (if useful).
   - **Non-sensitive hostnames and ports inside Compose** where no credential is embedded: e.g. `REDIS_HOST=redis`, `REDIS_PORT=6379`, `POSTGRES_HOST=db`, `POSTGRES_PORT=5432`, `MINIO_ENDPOINT=http://minio:9000`, `OLLAMA_HOST=http://ollama:11434` — only if these match **service names** in **your** `docker-compose` file and expose **no secret in the URL**.
   - Public dev-only endpoints with **no** auth in the URL (rare; verify per team).
3. **Anything that authenticates** (DB user/password, JWT secret, `AWS_SECRET_ACCESS_KEY`, MinIO keys, Redis password, third-party API tokens) → **Cursor Secrets only**; list the **exact variable names** the app and Compose expect in the **Secrets checklist** section of your output.
4. Prefer **splitting** connection config: safe literals in `environment.json` + secrets for `POSTGRES_PASSWORD`, then document that the app or an entrypoint script composes `DATABASE_URL` — **only if** the repo already supports that pattern; do not invent fragile shell hacks without user confirmation.
5. If the repo uses **`env_file: .env`** in Compose, keep **`.env` gitignored**; do not duplicate secrets into `environment.json`.

## Prerequisites

1. **`cursor-kit` layout** (real `.cursor/`, linked toolkit) is already in place where this repo uses it; see [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md).
2. **Mandatory reads** before editing:
   - [`.cursor/context/project-docs-contract.md`](../context/project-docs-contract.md) — project-specific runtime detail belongs in **`docs/ai/`** (e.g. `dev-runtime.md`), not in universal `.cursor/context`.
3. **Delegation:** use **`devops-agent`** for Compose/install/CI alignment; **`docs-agent`** to cross-link or add **`docs/ai/dev-runtime.md`** (ports, compose file names, env var **names**); **`security-agent`** if anything touches credentials, exposure, or production paths.

## Required workflow

1. **Discover** (read-only):
   - `docker-compose.yml`, `compose.yaml`, `docker-compose.*.yml`, `**/compose*.yml` — service names, ports, `depends_on`, healthchecks, `profiles`, `env_file` references.
   - `package.json` / workspace files — package manager (`npm` / `pnpm` / `yarn`), `engines`, relevant `scripts` (`dev`, `test`, `db:migrate`, etc.).
   - `Dockerfile`, `.devcontainer/`, `.github/workflows/*` — only if they change how the cloud agent should install or start infra.
   - Existing **`.cursor/environment.json`** — extend or refine; do not wipe useful fields without summarizing what was removed.

2. **Design the cloud flow** (document assumptions in chat):
   - Typical pattern: **`install`** runs dependency install **and** starts infra, e.g. `docker compose up -d` (with `-f` if needed), then waits for health (use `docker compose run --rm` + wait script **only if** already conventional in this repo; otherwise minimal `docker compose up -d` and rely on healthchecks / documented follow-up).
   - Use **Compose service DNS names** as hosts in safe `env` values (`db`, `redis`, `minio`, …), **not** `localhost`, unless the repo’s Cloud setup explicitly documents localhost for that agent runtime.
   - Add **`terminals`** or **`start`** only when aligned with [Cursor’s documented](https://cursor.com/docs/cloud-agent/setup) shape and the repo’s real dev server story.

3. **Write `.cursor/environment.json`** with:
   - A correct top-level shape per **current Cursor docs**.
   - **`install`**: idempotent, non-interactive (e.g. `npm ci` / `pnpm install --frozen-lockfile` at the right directory; then `docker compose …` if used).
   - **`env`**: **only** the safe literals from the rules above. Omit a key entirely if its value would be a secret.

4. **Secrets checklist (required output)**  
   After editing, print a markdown **table** (or bullet list) for the user:

   | Variable name (set in Cursor Secrets) | Purpose | Used by |
   |---------------------------------------|---------|---------|
   | … | … | e.g. app, compose, Prisma |

   Include every variable the **app or Compose** needs that you **did not** put in `environment.json`. Use the **exact names** the codebase expects (`DATABASE_URL`, `TEST_DATABASE_URL`, `REDIS_PASSWORD`, `MINIO_ACCESS_KEY`, etc.). Tell the user: **Cursor Dashboard → Secrets** (team or personal per org policy); never commit values.

5. **`docs/ai/dev-runtime.md`**  
   Add or update a short subsection: Cloud agent assumptions (compose file path, service names, which vars are in Secrets). Link to `.cursor/environment.json`.

6. **Cross-link**  
   **`/adopt-cloud-env`** is **separate** from **`/adopt-repo-docs`** (docs/ai bootstrap). Users who do **not** use Cloud agents never need this command.
   - If **`docs/ai/`** already exists from **`/adopt-repo-docs`**, align **`docs/ai/dev-runtime.md`** with this pass.
   - If `dev-runtime.md` is missing and the user has **not** run **`/adopt-repo-docs`**, create a minimal **`docs/ai/dev-runtime.md`** with **`docs-agent`** here **or** suggest they run **`/adopt-repo-docs`** first for a fuller doc set.

## Example shape (illustrative — adapt to Cursor docs and your repo)

Do not copy verbatim if services differ. **No secrets below.**

```json
{
  "install": "docker compose -f docker-compose.yml up -d && npm ci",
  "env": {
    "NODE_ENV": "development",
    "POSTGRES_HOST": "db",
    "POSTGRES_PORT": "5432",
    "POSTGRES_DB": "app_dev",
    "REDIS_HOST": "redis",
    "REDIS_PORT": "6379",
    "S3_ENDPOINT": "http://minio:9000",
    "OLLAMA_BASE_URL": "http://ollama:11434"
  }
}
```

Secrets the user must configure separately (names only — **examples**; replace with what the repo actually reads):

- `DATABASE_URL` — full Postgres URL if the app expects a single var.
- `TEST_DATABASE_URL` — if tests use a second DB.
- `POSTGRES_USER` / `POSTGRES_PASSWORD` — if the app or Compose resolves them instead of `DATABASE_URL`.
- `REDIS_PASSWORD` — if Redis is authenticated.
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` (or project-specific names) — for S3-compatible dev storage.
- Any **JWT**, **API**, or **webhook** secrets for dev services.

## Output (required)

- **Diff summary**: what changed in `.cursor/environment.json` (and `docs/ai/dev-runtime.md` if touched).
- **Assumptions**: compose file path, package manager, ports, services started.
- **Secrets checklist**: table of **all** variables that must be set in **Cursor Secrets** (none omitted).
- **Risks / follow-ups**: e.g. “Cloud sandbox must support Docker”; “add healthcheck wait script”; “run `/adopt-repo-docs` if `dev-runtime.md` missing”.
