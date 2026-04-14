# cursor-kit adoption (split `.cursor` layout)

This document explains how to use the internal **`cursor-kit`** CLI from the `cursor-base` workspace to adopt the shared Cursor toolkit in a normal project repository.

**Note:** the `cursor-base` repository is primarily a **shared toolkit** checkout. It may ship with only minimal top-level `docs/` (for example this file) while linked `.cursor` rules still describe the fuller **`docs/ai/`** layout expected in **consumer application repositories**. That is normal: use this page for workspace mechanics; use your app’s `docs/ai/` for product-specific agent context.

For command flags and safety rules, see the package README: [`packages/cursor-kit/README.md`](../../packages/cursor-kit/README.md).

Portable copy (travels when `.cursor/docs` is symlinked): [`.cursor/docs/cursor-kit-adoption.md`](../../.cursor/docs/cursor-kit-adoption.md).

## Recommended layout in a consumer project

- **`project/.cursor/`** is a real directory (not a symlink to another repo).
- **Shared** subtrees are **symlinks** into `cursor-base/.cursor/` (for example `agents`, `rules`, …).
- **Repo-local** Cursor configuration stays as real files, typically:
  - `.cursor/environment.json`
  - `.cursor/mcp.json`
  - `.cursor/hooks.json`
- **Project knowledge** for agents belongs in **`docs/ai/`** and **`docs/`**, per the separation contract in `.cursor/context/project-docs-contract.md` (when that file is present in your linked toolkit).

## New or existing repo: full onboarding

Use this order so filesystem layout is correct before agents author **`docs/ai/`** content.

1. **Toolchain:** Node.js 20+, `cursor-kit` installed or built from `cursor-base` (see package README).
2. **Scaffold local Cursor files:** `cursor-kit init-project --project <repo>` (use `--dry-run` first if you prefer).
3. **Link shared toolkit:** `cursor-kit link --shared <path-to-cursor-base> --project <repo>` (again, `--dry-run` first is fine).
4. **Validate:** `cursor-kit doctor --project <repo>` — fix any **errors** before continuing.
5. **Complete `docs/ai` in Cursor:** open the project in Cursor and run the slash command **`/adopt-repo-docs`** (defined in `.cursor/commands/` once linked). That command drives agents to inspect the repo and create or refresh the adoption set (`docs/ai/README.md`, `AGENT_ADOPTION.md`, `source-of-truth.md`, navigation docs, `AGENTS.md`, optional design notes).
6. **Cursor Cloud agents:** run **`/adopt-cloud-env`** to draft **`.cursor/environment.json`** with only **non-secret** `env` values and to list **Cursor Secrets** you must set for credentials (see `.cursor/commands/adopt-cloud-env.md`).
7. **UI-heavy repos:** after `/adopt-repo-docs`, if you maintain a real frontend stack, follow with **`/adopt-design-system`** for `docs/ai/design-system.md`, `ui-stack.md`, and `ui-patterns.md`.
8. **Commit** what you intend to track (often `AGENTS.md`, `docs/ai/**`, `.cursor/mcp.json`). Do not commit secrets.

`cursor-kit doctor` may **warn** when core `docs/ai` entry files are still missing after a successful **`link`** (manifest present); that reminder points you at **`/adopt-repo-docs`**.

---

## Legacy migration: whole `project/.cursor` was one symlink

If `.cursor` is currently a **single symlink** to `cursor-base/.cursor` (or any other directory), **`cursor-kit link` will refuse** until you use a split layout. That avoids creating paths **through** the symlink into the canonical repo by mistake.

### Before you start

- Work from the **repository root** of the **consumer** project (the app repo), not from inside `cursor-base`.
- In **monorepos**, run these steps from the package root that should own `.cursor/` (usually the repo root).
- **Linux** is the primary target; other Unix-like systems usually behave the same. Windows paths are not the focus of this guide.
- Optional preflight: `cursor-kit doctor --project .` — you should see a **split layout** error while `.cursor` is still a symlink.

### 1. Back up and remove the old symlink

1. Copy out any **repo-local** files you created under the old symlinked tree (for example `.cursor/mcp.json`, `.cursor/hooks.json`, custom scripts) to a safe place **outside** `.cursor`.
2. **Rename** the symlink instead of deleting it outright (easy rollback):

   ```bash
   mv .cursor ".cursor.bak.$(date +%Y%m%d-%H%M%S)"
   ```

   Keep that backup until `link` and `doctor` succeed.

### 2. Create a real `.cursor` directory

```bash
mkdir .cursor
```

### 3. Scaffold and link

```bash
cursor-kit init-project --project .
cursor-kit link --shared /absolute/path/to/cursor-base --project .
```

Use `--dry-run` on each command first if you want a preview.

### 4. Restore local-only files

Copy your backed-up **`mcp.json`**, **`hooks.json`**, **`environment.json`**, or other **non-symlink** config into `.cursor/` as normal files. Do not replace managed symlink entries (`agents`, `rules`, …) with copies of the shared tree.

### 5. Verify

```bash
cursor-kit doctor --project .
```

- Expect **no errors** for split layout, shared source, and symlinks.
- In **`cursor-base`**, run `git status` and confirm you did **not** accidentally modify the shared checkout while the old symlink existed or during migration.

### 6. Remove the backup when satisfied

When everything works:

```bash
rm -rf ".cursor.bak.<timestamp>"
```

(or keep the backup outside the repo).

### Edge cases and notes

- **CI / headless:** `doctor` and discovery rely on the filesystem only; avoid relying on `$HOME`-based auto-detection in CI—pass **`--shared`** explicitly.
- **`unlink` does not migrate** a whole-directory `.cursor` symlink: it only removes symlinks listed in `.cursor/.cursor-kit-managed.json`. Migration is always: break root symlink → real dir → `init-project` → `link`.

---

## Environment variables

- **`CURSOR_BASE_DIR`**: absolute path to the **`cursor-base` repository root** (must contain `.cursor/`).

## Operational notes while developing `cursor-base`

The shared tree in `cursor-base` may include example `mcp.json` / `hooks.json` files for the toolkit repo itself. Consumer projects should still treat those filenames as **local** and not symlink them.

If you run `doctor` with `--project` pointed at `cursor-base` itself, you may see warnings about missing local `mcp.json` under `project/.cursor/` depending on how you lay out that repository—this is expected and optional to address.
