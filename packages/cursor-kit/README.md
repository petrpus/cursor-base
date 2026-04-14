# cursor-kit

Internal CLI for adopting the **shared Cursor toolkit** from the `cursor-base` repository into individual project repositories.

## Why this exists

The canonical `cursor-base` repository holds reusable Cursor assets under `.cursor/` (agents, rules, commands, generic docs, and so on). Project-specific knowledge belongs in **`docs/ai/`** and **`docs/`**, not inside `.cursor/`.

Historically, some teams symlinked an entire `project/.cursor` directory to `cursor-base/.cursor`. That model is fragile (accidental writes into the shared repo, unclear ownership, and awkward Git hygiene).

**Recommended model:**

- `project/.cursor/` is a **real local directory**
- selected shared subtrees are **symlinks** into `cursor-base/.cursor/`
- repo-local Cursor files remain **real files** in the project (for example `.cursor/mcp.json`)

This package automates that layout with explicit safety rules.

## Requirements

- Linux-friendly paths (also works on macOS in most setups)
- Node.js **20+**

## Installation in this workspace

From the `cursor-base` repository root:

```bash
npm install
npm run build -w cursor-kit
```

Run the CLI:

```bash
npm run cursor-kit -- doctor --project ~/Code/some-app
# or
node packages/cursor-kit/dist/cli.js link --help
```

From another repository (after install/linking workflow you prefer):

```bash
npx --yes file:/abs/path/to/cursor-base/packages/cursor-kit doctor --project .
```

## Path discovery for the shared toolkit

Priority order:

1. **`--shared <path>`** — may be either:
   - the `cursor-base` repository root (the tool will use `<path>/.cursor` when present), or
   - the shared `.cursor` directory itself
2. **`CURSOR_BASE_DIR`** — must point to the **`cursor-base` repository root** (the directory that contains a `.cursor/` child)
3. **Conservative auto-detection**:
   - walk parent directories of `--project` / current working directory looking for `cursor-base/.cursor`
   - fall back to `$HOME/Code/cursor-base/.cursor` when it looks valid

## Commands

### `link`

Creates `project/.cursor/` (if needed) and symlinks the default shared entries:

- Directories: `agents`, `commands`, `context`, `docs`, `hooks`, `rules`
- Optional: `--include-local` also links `local/`
- Files (only if present in shared): `README.md`, `manifest.md`

**Never linked** (must remain repo-local in consumer projects):

- `.cursor/environment.json`
- `.cursor/mcp.json`
- `.cursor/hooks.json`

Flags:

- `--project <path>` (default: current working directory)
- `--shared <path>` (optional; see discovery above)
- `--dry-run`
- `--force` replaces **wrong managed symlinks** only (never replaces real directories/files)
- `--include-local`

**Idempotency:** repeated `link` is a no-op when everything already matches.

**Whole-directory `.cursor` symlink:** `link` refuses by default. Use the **legacy migration** procedure (backup `mv`, `mkdir`, `init-project`, `link`, `doctor`) in [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md).

### `unlink`

Removes **only** symlinks recorded in:

- `.cursor/.cursor-kit-managed.json`

Local files like `mcp.json` are untouched.

Flags:

- `--project <path>`
- `--dry-run`

`--force` is reserved; manifest-less unlink is intentionally not enabled for safety.

### `doctor`

Validates:

- `.cursor` exists and is not a whole-directory symlink (migration signal)
- shared source resolves and looks like a real shared `.cursor` tree
- expected symlinks exist and resolve to the shared paths
- optional local files exist (`environment.json`, `mcp.json`, `hooks.json`) — warns if missing
- after a successful **`link`** (managed manifest present), warns if core **`docs/ai`** entry files are still missing (`README.md`, `AGENT_ADOPTION.md`, `source-of-truth.md`) — run **`/adopt-repo-docs`** in Cursor

Exits non-zero when checks with severity `error` fail.

### `init-project`

Creates conservative starter files **only if missing** (unless `--force`):

- `.cursor/environment.json`
- `.cursor/mcp.json`
- `.cursor/hooks.json`
- `AGENTS.md`
- `docs/ai/INDEX.md`
- `docs/ai/CLOUD_AGENT.md`

This command does **not** link shared content.

**Note:** many agents and rules assume a richer **`docs/ai/`** set (for example `README.md`, `AGENT_ADOPTION.md`, `source-of-truth.md`). `init-project` intentionally scaffolds only a small baseline.

**Completing `docs/ai`:** after `init-project` + `link` + `doctor`, open the project in **Cursor** and run the slash command **`/adopt-repo-docs`** (defined under `.cursor/commands/` in the linked toolkit). That drives agents to create the adoption set; use **`/adopt-design-system`** afterward for UI-focused repos.

## End-to-end onboarding (consumer repo)

1. `npm install` / `npm run build -w cursor-kit` in `cursor-base` (or install `cursor-kit` from that checkout).
2. In the app repo: `cursor-kit init-project --project .` then `cursor-kit link --shared <cursor-base> --project .` (use `--dry-run` first if you want).
3. `cursor-kit doctor --project .` — resolve **errors**.
4. In Cursor: **`/adopt-repo-docs`** — then **`/adopt-design-system`** if you ship a UI.
5. Commit tracked files; never commit secrets in `mcp.json`.

## Terminal output

The CLI prints structured sections, tables, and light status icons. Disable styling with:

- `--no-color`
- `NO_COLOR=1`

## Safety guarantees (by design)

- **No recursive deletes** of arbitrary project directories.
- **`unlink` only removes** entries that are:
  - listed in the managed manifest, and
  - symlinks that still resolve to the expected shared target
- **`link` does not replace** real files/directories with symlinks.
- **`--dry-run`** performs planning only (no symlink creation, no manifest writes).

## Limitations (MVP)

- No automatic **removal** of a whole-`.cursor` symlink (use the documented migration in `docs/dev/cursor-kit.md`).
- Repo analysis and full **`docs/ai`** authoring live in **Cursor** (`/adopt-repo-docs`), not in this CLI.
- No “cloud adopt” intelligence yet (planned as separate commands later).

## Future commands (planned extension points)

Examples reserved for later versions:

- `adopt-cloud-env`
- `refresh-cloud-env`

Keep the core engines (`src/core/`) small and composable so new commands can reuse the same filesystem utilities and UI layer.
