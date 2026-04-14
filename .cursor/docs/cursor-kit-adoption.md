# cursor-kit adoption (portable copy)

This file lives under the shared `.cursor/docs/` tree so it can travel with the toolkit when `docs/` is symlinked into consumer projects.

Authoritative maintenance copy of the same guidance also exists at:

- [`docs/dev/cursor-kit.md`](../../docs/dev/cursor-kit.md)

## Summary

Use **`cursor-kit`** to:

- keep `project/.cursor/` as a **real directory**
- symlink selected shared directories/files from `cursor-base/.cursor/`
- keep secrets and machine-local Cursor config as **real files** in the project

## Quickstart

```bash
# from cursor-base (build once)
npm install
npm run build -w cursor-kit

# from your project
/path/to/cursor-base/node_modules/.bin/cursor-kit init-project --project .
/path/to/cursor-base/node_modules/.bin/cursor-kit link --shared /path/to/cursor-base --project .
```

Prefer `npm run cursor-kit -- ...` from the `cursor-base` workspace during development.

## Migration away from a whole `.cursor` symlink

If `.cursor` is a symlink, remove it, recreate a directory, then run `init-project` + `link`. `cursor-kit doctor` detects this situation.

See `docs/dev/cursor-kit.md` for the full checklist.
