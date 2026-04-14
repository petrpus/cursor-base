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

## Onboarding checklist

1. Ensure Node.js 20+ is available.
2. In `cursor-base`, run `npm install` and `npm run build -w cursor-kit`.
3. In your project:
   - run `cursor-kit init-project --project <repo>` (dry-run first if you want)
   - run `cursor-kit link --shared <cursor-base> --project <repo>` (add `--dry-run` first)
4. Commit the real files you want tracked (often `AGENTS.md`, `docs/ai/*`, `.cursor/mcp.json`, …). Be careful not to commit secrets.

## Migrating from `project/.cursor -> cursor-base/.cursor`

If `.cursor` is currently a **single symlink** to the shared directory:

1. **Stop** using that model (it is easy to accidentally mutate the shared repo through the symlink).
2. Back up any local-only files you created inside `.cursor` (for example `mcp.json`).
3. Remove the symlink:
   - `rm .cursor` (from the project root)
4. Recreate a real directory and scaffold local files:
   - `mkdir .cursor`
   - run `cursor-kit init-project --project .`
5. Re-apply shared links:
   - `cursor-kit link --shared <path-to-cursor-base> --project .`
6. Restore backed-up local files if needed.

`cursor-kit doctor` will flag a whole-directory `.cursor` symlink as an error and point you back to this migration path.

## Environment variables

- **`CURSOR_BASE_DIR`**: absolute path to the **`cursor-base` repository root** (must contain `.cursor/`).

## Operational notes while developing `cursor-base`

The shared tree in `cursor-base` may include example `mcp.json` / `hooks.json` files for the toolkit repo itself. Consumer projects should still treat those filenames as **local** and not symlink them.

If you run `doctor` with `--project` pointed at `cursor-base` itself, you may see warnings about missing local `mcp.json` under `project/.cursor/` depending on how you lay out that repository—this is expected and optional to address.
