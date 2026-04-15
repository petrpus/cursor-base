/** Root epilog: printed after the command list for `cursor-kit --help` / `-h`. */
export const HELP_EPILOG_ROOT = `
Overview
  cursor-kit wires a consumer repository to a canonical cursor-base checkout: it creates a
  real project .cursor/ directory, hard-copies selected shared entries from cursor-base,
  records per-file hashes in .cursor/.cursor-kit-managed.json (manifest v3), and can validate
  the result (doctor), refresh from upstream (update), or remove managed kit (unlink).
  It does not generate full docs/ai content; use the Cursor slash command /adopt-repo-docs after init.

Typical workflow (new repo)
  1. cursor-kit init --shared <path-to-cursor-base> --project <repo>
  2. cursor-kit doctor --project <repo>
  3. cursor-kit update --project <repo>   (pull upstream kit changes; skips local edits unless --force)
  4. In Cursor: /adopt-repo-docs (and /adopt-design-system if you have a UI stack); skip docs step if you maintain docs/ai yourself
  5. Optional: /adopt-cloud-env only if you use Cursor Cloud agents (separate from adopt-repo-docs)

Shared toolkit path (--shared / CURSOR_BASE_DIR)
  Order of resolution when --shared is omitted:
    1. CLI option --shared (repo root or .../.cursor directory)
    2. Environment variable CURSOR_BASE_DIR (cursor-base repository root)
    3. Walk parents of --project for .../cursor-base/.cursor
    4. Fallback: $HOME/Code/cursor-base/.cursor if it looks valid

  Always pass --shared in CI or ambiguous directory layouts.

Global output
  --no-color     Disable ANSI colors and prefer ASCII status markers
  NO_COLOR=1     Same effect (common in CI)
  FORCE_COLOR    Force color when stdout is not a TTY

Documentation
  Package README and migration guide live in the cursor-base repo:
    docs/dev/cursor-kit.md
    packages/cursor-kit/README.md
`;

export const HELP_AFTER_INIT = `
What init does
  1) Scaffolds repo-local Cursor files (unless they already exist): .cursor/*.json templates,
     AGENTS.md, and minimal docs/ai stubs — use --force to overwrite those scaffold targets.
  2) Hard-copies shared toolkit directories/files from the resolved cursor-base .cursor into
     project/.cursor/ (agents, commands, context, docs, hooks, rules, optional README.md, manifest.md).
  With --include-local: also copies shared local/ when present.

  Never overwrites repo-local-only files beyond the scaffold list:
    .cursor/environment.json, .cursor/mcp.json, .cursor/hooks.json (created if missing)

Safety
  Refuses if project/.cursor is a whole-directory symlink (legacy layout); migrate using docs/dev/cursor-kit.md.
  Existing real directories under managed names require --force to replace wholesale; otherwise
  per-file reconcile preserves local edits.

Examples
  cursor-kit init --project ~/Code/my-app
  cursor-kit init --shared ~/Code/cursor-base --project . --dry-run
  cursor-kit init --shared ~/Code/cursor-base --include-local --project .
  cursor-kit init --project . --source public
`;

export const HELP_AFTER_UNLINK = `
What unlink does
  Reads .cursor/.cursor-kit-managed.json and removes only managed entries (directories/files
  under .cursor/). Local-only files (mcp.json, hooks.json, etc.) are never removed.

  Without a manifest, unlink refuses. --force-without-manifest does not enable unsafe
  manifest-less removal (safety-restricted).
  For modified managed copies (per-file hash drift), unlink skips by default; use --force-remove-modified-copy
  to remove them.

Examples
  cursor-kit unlink --project . --dry-run
  cursor-kit unlink --project ~/Code/my-app
`;

export const HELP_AFTER_UPDATE = `
What update does
  Reconciles the hard-copied managed kit with the shared source: adds new files, updates files
  that still match the last recorded hash, deletes files removed upstream when safe, and skips
  paths you edited locally unless you pass --force.

  Does not modify docs/ai (outside .cursor managed paths) or repo-local .cursor/*.json beyond the manifest.

Examples
  cursor-kit update --project .
  cursor-kit update --project . --dry-run
  cursor-kit update --project . --source public
  cursor-kit update --project . --force
`;

export const HELP_AFTER_DOCTOR = `
What doctor does
  Checks that project/.cursor exists and is not a whole-directory symlink, resolves the shared
  toolkit path, validates expected managed entries, and (for manifest v3) compares per-file
  hashes. If a managed manifest exists, warns when core docs/ai entry files are still missing
  (README.md, AGENT_ADOPTION.md, source-of-truth.md) and suggests /adopt-repo-docs in Cursor.

Exit code
  0 when no error-severity checks failed; non-zero when any error is reported (warnings alone
  still exit 0).

Examples
  cursor-kit doctor --project .
  cursor-kit doctor --shared ~/Code/cursor-base --project ~/Code/my-app
  cursor-kit doctor --include-local --project .
`;

export const HELP_AFTER_INIT_PROJECT = `
What init-project does (deprecated alias)
  Scaffolds repo-local files only — same as the first phase of cursor-kit init, without copying
  the shared kit. Prefer: cursor-kit init

Examples
  cursor-kit init-project --project . --dry-run
`;
