# cursor-kit adoption (split `.cursor` layout)

This document explains how to use the internal **`cursor-kit`** CLI from the `cursor-base` workspace to adopt the shared Cursor toolkit in a normal project repository.

**Note:** the `cursor-base` repository is primarily a **shared toolkit** checkout. It may ship with only minimal top-level `docs/` (for example this file) while the **installed** `.cursor` rules still describe the fuller **`docs/ai/`** layout expected in **consumer application repositories**. That is normal: use this page for workspace mechanics; use your app’s `docs/ai/` for product-specific agent context.

For command flags and safety rules, see the package README: [`packages/cursor-kit/README.md`](../../packages/cursor-kit/README.md).

Portable copy (this page also lives under `.cursor/docs/` so it ships with the kit after **`cursor-kit init`**): [`.cursor/docs/cursor-kit-adoption.md`](../../.cursor/docs/cursor-kit-adoption.md).

## Recommended layout in a consumer project

- **`project/.cursor/`** is a real directory (not a symlink to another repo).
- Shared entries are **hard-copied** from `cursor-base/.cursor/` by **`cursor-kit init`**, with **manifest v3** (per-file hashes in `.cursor/.cursor-kit-managed.json`).
- **`cursor-kit update`** reconciles copies with upstream; it **skips files you edited locally** unless you pass **`--force`**.
- **Repo-local** Cursor configuration stays as real files, typically:
  - `.cursor/environment.json`
  - `.cursor/mcp.json`
  - `.cursor/hooks.json`
- **Project knowledge** for agents belongs in **`docs/ai/`** and **`docs/`**, per the separation contract in `.cursor/context/project-docs-contract.md` (when that file is present in your installed toolkit).

## New or existing repo: full onboarding

Use this order so filesystem layout is correct before agents author **`docs/ai/`** content.

1. **Toolchain:** Node.js 20+, `cursor-kit` from npm (`npm install -g cursor-kit` / `npx cursor-kit`), or built from this `cursor-base` workspace (see [`packages/cursor-kit/README.md`](../../packages/cursor-kit/README.md)).
2. **Install kit + scaffold locals:** `cursor-kit init --shared <path-to-cursor-base> --project <repo>` (use `--dry-run` first if you prefer).  
   - For public source on branch `main`: add `--source public`.  
   - `--source auto` first attempts local discovery and falls back to public `main` only when local resolution fails.
3. **Validate:** `cursor-kit doctor --project <repo>` — fix any **errors** before continuing.
4. **Refresh (optional):** run `cursor-kit update --project <repo>` when you want to pull newer shared content. Use **`--force`** to overwrite local edits under managed `.cursor/` paths.
5. **Complete `docs/ai` in Cursor:** open the project in Cursor and run the slash command **`/adopt-repo-docs`** (defined in `.cursor/commands/` once the kit is installed). That command drives agents to inspect the repo and create or refresh the adoption set (`docs/ai/README.md`, `AGENT_ADOPTION.md`, `source-of-truth.md`, navigation docs, `AGENTS.md`, optional design notes). **Skip this if you only want filesystem + local `.cursor` files** and will maintain `docs/ai` yourself.
6. **UI-heavy repos:** after `/adopt-repo-docs`, if you maintain a real frontend stack, follow with **`/adopt-design-system`** for `docs/ai/design-system.md`, `ui-stack.md`, and `ui-patterns.md`.
7. **Cursor Cloud agents (optional):** only if you use them, run **`/adopt-cloud-env`** separately to draft **`.cursor/environment.json`** (safe `env` literals only) and get a **Cursor Secrets** checklist — see `.cursor/commands/adopt-cloud-env.md`. This is **not** part of **`/adopt-repo-docs`**.
8. **Commit** what you intend to track (often `AGENTS.md`, `docs/ai/**`, `.cursor/mcp.json`). Do not commit secrets.

`cursor-kit doctor` may **warn** when core `docs/ai` entry files are still missing after a successful **`init`** (manifest present); that reminder points you at **`/adopt-repo-docs`**.

---

## Legacy migration: whole `project/.cursor` was one symlink

If `.cursor` is currently a **single symlink** to `cursor-base/.cursor` (or any other directory), **`cursor-kit init` will refuse** until you use a split layout. That avoids creating paths **through** the symlink into the canonical repo by mistake.

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

   Keep that backup until `init` and `doctor` succeed.

### 2. Create a real `.cursor` directory

```bash
mkdir .cursor
```

### 3. Install shared kit

```bash
cursor-kit init --shared /absolute/path/to/cursor-base --project .
```

Use `--dry-run` first if you want a preview.

### 4. Restore local-only files

Copy your backed-up **`mcp.json`**, **`hooks.json`**, **`environment.json`**, or other **local** config into `.cursor/` as normal files.

### 5. Verify

```bash
cursor-kit doctor --project .
```

- Expect **no errors** for split layout, shared source, and managed copies.
- In **`cursor-base`**, run `git status` and confirm you did **not** accidentally modify the shared checkout while the old symlink existed or during migration.

### 6. Remove the backup when satisfied

When everything works:

```bash
rm -rf ".cursor.bak.<timestamp>"
```

(or keep the backup outside the repo).

### Edge cases and notes

- **CI / headless:** `doctor` and discovery rely on the filesystem only; avoid relying on `$HOME`-based auto-detection in CI—pass **`--shared`** explicitly.
- **`unlink` does not migrate** a whole-directory `.cursor` symlink: it only removes entries listed in `.cursor/.cursor-kit-managed.json`. Migration is always: break root symlink → real dir → **`cursor-kit init`**.

---

## Migrating from legacy symlink manifests (v2)

If `.cursor/.cursor-kit-managed.json` still records **`mode: symlink`**, **`cursor-kit update`** will refuse. Run **`cursor-kit init --force`** once to replace managed entries with hard copies and upgrade to **manifest v3**.

---

## Manifest v3 and `update`

- Managed files are tracked with **per-file** content hashes.
- **`update`** merges upstream changes file-by-file and skips locally modified paths unless **`--force`**.
- For safety, **`unlink`** skips removing a managed root when on-disk files diverge from the manifest unless **`--force-remove-modified-copy`**.

---

## Environment variables

- **`CURSOR_BASE_DIR`**: absolute path to the **`cursor-base` repository root** (must contain `.cursor/`).

## Operational notes while developing `cursor-base`

The shared tree in `cursor-base` may include example `mcp.json` / `hooks.json` files for the toolkit repo itself. Consumer projects should still treat those filenames as **local** and not copy them from the shared tree into production secrets.

If you run `doctor` with `--project` pointed at `cursor-base` itself, you may see warnings about missing local `mcp.json` under `project/.cursor/` depending on how you lay out that repository—this is expected and optional to address.
