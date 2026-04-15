# cursor-kit adoption (portable copy)

This file lives under the shared `.cursor/docs/` tree so it is copied into consumer projects with the rest of the kit when you run **`cursor-kit init`**.

Authoritative maintenance copy of the same guidance also exists at:

- [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md)

## Summary

Use **`cursor-kit`** to:

- keep `project/.cursor/` as a **real directory**
- **hard-copy** shared directories/files from `cursor-base/.cursor/` and record **manifest v3** (per-file hashes)
- keep secrets and machine-local Cursor config as **real files** in the project

Then use Cursor’s **`/adopt-repo-docs`** command (in `.cursor/commands/`) to build out **`docs/ai/`** and related adoption files.

## Quickstart

```bash
# from cursor-base (build once)
npm install
npm run build -w cursor-kit

# from your project
/path/to/cursor-base/node_modules/.bin/cursor-kit init --shared /path/to/cursor-base --project .
cursor-kit doctor --project .
```

Prefer `npm run cursor-kit -- ...` from the `cursor-base` workspace during development.

In **Cursor**, run **`/adopt-repo-docs`** to complete the `docs/ai` adoption set (skip if you do not use that flow). For frontend repos, follow with **`/adopt-design-system`**. **`/adopt-cloud-env`** is a **separate** optional step **only** for **Cursor Cloud agents** (`.cursor/environment.json` + Secrets checklist).

## Migration away from a whole `.cursor` symlink

Do **not** only `rm .cursor` until you have backed up local files. Recommended:

1. Save any local-only files from `.cursor` (e.g. `mcp.json`) elsewhere.
2. `mv .cursor ".cursor.bak.$(date +%Y%m%d-%H%M%S)"`
3. `mkdir .cursor`
4. `cursor-kit init --shared <cursor-base> --project .`
5. Restore local files; run `cursor-kit doctor`.

Full checklist, edge cases, and onboarding order: [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md).
