# cursor-kit

Internal CLI for adopting the **shared Cursor toolkit** from the `cursor-base` repository into individual project repositories.

## Why this exists

The canonical `cursor-base` repository holds reusable Cursor assets under `.cursor/` (agents, rules, commands, generic docs, and so on). Project-specific knowledge belongs in **`docs/ai/`** and **`docs/`**, not inside `.cursor/`.

Historically, some teams symlinked an entire `project/.cursor` directory to `cursor-base/.cursor`. That model is fragile (accidental writes into the shared repo, unclear ownership, and awkward Git hygiene).

**Recommended model:**

- `project/.cursor/` is a **real local directory**
- `cursor-kit init` **hard-copies** the shared subtrees from `cursor-base/.cursor/` into the project and records **manifest v3** (per-file content hashes in `.cursor/.cursor-kit-managed.json`)
- `cursor-kit update` reconciles those copies with upstream, **skipping files you changed locally** unless you pass **`--force`**
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
node packages/cursor-kit/dist/cli.js -h
node packages/cursor-kit/dist/cli.js init --help
```

Use **`-h`** or **`--help`** on the program or any subcommand for structured English help (overview, path discovery, workflow, and command-specific sections). **`--version`** / **`-V`** prints the package version.

From another repository (for example via `npx`):

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

When `--source auto` is used and local resolution fails, cursor-kit falls back to the public source
repository (`cursor-sh/cursor-base`) on branch `main`.

## Commands

### `init`

Creates `project/.cursor/` (if needed), scaffolds repo-local starter files (same set as legacy `init-project`), then **hard-copies** the default shared entries when the source exists:

- Directories: `agents`, `commands`, `context`, `docs`, `hooks`, `rules`
- Optional: `--include-local` also copies `local/`
- Files (only if present in shared): `README.md`, `manifest.md`

**Never overwritten by the kit copy phase** (repo-local only):

- `.cursor/environment.json`, `.cursor/mcp.json`, `.cursor/hooks.json` (created by scaffold if missing)

Flags:

- `--project <path>` (default: current working directory)
- `--shared <path>` (optional; see discovery above)
- `--dry-run`
- `--force` — overwrite scaffold targets and replace managed roots / force file-level overwrites where needed (including migrating off legacy symlink manifests)
- `--source <local|public|auto>` (default: `auto`; `public` clones from GitHub using `main`)
- `--source-repo <owner/repo>` (used with `--source public`; defaults to `cursor-sh/cursor-base`)
- `--include-local`

**Idempotency:** repeated `init` / `update` with the same source is safe; local edits under managed paths are preserved unless `--force` is used.

**Whole-directory `.cursor` symlink:** `init` refuses until you use the **legacy migration** procedure in [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md).

### `update`

Reconciles the hard-copied managed kit with the shared source (manifest **v3**, per-file hashes). Skips files whose content no longer matches the last recorded hash (local edits) unless **`--force`**.

Flags:

- `--project <path>`
- `--shared <path>` (optional for local source)
- `--force` — overwrite diverged files and delete removed-upstream files even when locally modified
- `--source <local|public|auto>` (default: `auto`)
- `--source-repo <owner/repo>` (used with `--source public`; defaults to `cursor-sh/cursor-base`)
- `--include-local`
- `--dry-run`

Symlink-based manifests (**v2 `mode: symlink`**) are rejected; run **`cursor-kit init --force`** once to migrate.

### `unlink`

Removes **only** managed entries recorded in:

- `.cursor/.cursor-kit-managed.json`

Local files like `mcp.json` are untouched. Modified managed copies are skipped by default (per-file hash drift for v3, tree digest for legacy v2 copy).

Flags:

- `--project <path>`
- `--dry-run`
- `--force-without-manifest` (still safety-restricted; manifest-less unlink is intentionally not implemented)
- `--force-remove-modified-copy` (remove managed copied entries even when local edits are detected)

### `doctor`

Validates:

- `.cursor` exists and is not a whole-directory symlink (migration signal)
- shared source resolves and looks like a real shared `.cursor` tree
- expected managed entries exist as real copies; **v3** manifest entries are checked against per-file hashes (warn on drift)
- optional local files exist (`environment.json`, `mcp.json`, `hooks.json`) — warns if missing
- after a successful **`init`** (managed manifest present), warns if core **`docs/ai`** entry files are still missing (`README.md`, `AGENT_ADOPTION.md`, `source-of-truth.md`) — run **`/adopt-repo-docs`** in Cursor

Exits non-zero when checks with severity `error` fail.

### Deprecated / hidden

- **`init-project`** (hidden): scaffold only; prints a deprecation warning. Prefer **`cursor-kit init`**.
- **`link`** (hidden): deprecated alias for **`cursor-kit init`** (copy-only).

## End-to-end onboarding (consumer repo)

1. `npm install` / `npm run build -w cursor-kit` in `cursor-base` (or install `cursor-kit` from that checkout).
2. In the app repo: `cursor-kit init --shared <path-to-cursor-base> --project .` (add `--source public` when you intentionally pull from GitHub `main`).
3. `cursor-kit doctor --project .` — resolve **errors**.
4. When you want upstream kit changes: `cursor-kit update --project . [--source public]` (add `--force` to overwrite local edits under managed paths).
5. In Cursor: **`/adopt-repo-docs`** (optional if you maintain `docs/ai` yourself) — then **`/adopt-design-system`** if you ship a UI.
6. In Cursor: **`/adopt-cloud-env`** only if you use **Cursor Cloud agents** and want `.cursor/environment.json` prepared.
7. Commit tracked files; never commit secrets in `mcp.json` or `.cursor/environment.json`.

## Terminal output

The CLI prints structured sections, tables, and light status icons. Disable styling with:

- `--no-color`
- `NO_COLOR=1`

## Safety guarantees (by design)

- **No recursive deletes** of arbitrary project directories.
- **`unlink` only removes** entries that are listed in the managed manifest and pass safety checks (symlink target for legacy symlink mode; hash match for copies unless forced).
- **`init` does not replace** unmanaged real directories under managed names without **`--force`** (otherwise per-file reconcile applies when a v3-compatible manifest already exists).
- **`--dry-run`** performs planning only (no manifest writes on full dry-run).

## Limitations (MVP)

- No automatic **removal** of a whole-`.cursor` symlink (use the documented migration in `docs/dev/cursor-kit.md`).
- Repo analysis and full **`docs/ai`** authoring live in **Cursor** (`/adopt-repo-docs`), not in this CLI.
- No “cloud adopt” intelligence yet (planned as separate commands later).

## Future commands (planned extension points)

Examples reserved for later versions:

- `adopt-cloud-env`
- `refresh-cloud-env`

Keep the core engines (`src/core/`) small and composable so new commands can reuse the same filesystem utilities and UI layer.
