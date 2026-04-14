# cursor-kit adoption (portable copy)

This file lives under the shared `.cursor/docs/` tree so it can travel with the toolkit when `docs/` is symlinked into consumer projects.

Authoritative maintenance copy of the same guidance also exists at:

- [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md)

## Summary

Use **`cursor-kit`** to:

- keep `project/.cursor/` as a **real directory**
- symlink selected shared directories/files from `cursor-base/.cursor/`
- keep secrets and machine-local Cursor config as **real files** in the project

Then use Cursor’s **`/adopt-repo-docs`** command (in `.cursor/commands/`) to build out **`docs/ai/`** and related adoption files.

## Quickstart

```bash
# from cursor-base (build once)
npm install
npm run build -w cursor-kit

# from your project
/path/to/cursor-base/node_modules/.bin/cursor-kit init-project --project .
/path/to/cursor-base/node_modules/.bin/cursor-kit link --shared /path/to/cursor-base --project .
cursor-kit doctor --project .
```

Prefer `npm run cursor-kit -- ...` from the `cursor-base` workspace during development.

In **Cursor**, run **`/adopt-repo-docs`** to complete the `docs/ai` adoption set. For frontend repos, follow with **`/adopt-design-system`**.

## Migration away from a whole `.cursor` symlink

Do **not** only `rm .cursor` until you have backed up local files. Recommended:

1. Save any local-only files from `.cursor` (e.g. `mcp.json`) elsewhere.
2. `mv .cursor ".cursor.bak.$(date +%Y%m%d-%H%M%S)"`
3. `mkdir .cursor`
4. `cursor-kit init-project --project .` then `cursor-kit link --shared <cursor-base> --project .`
5. Restore local files; run `cursor-kit doctor`.

Full checklist, edge cases, and onboarding order: [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md).
