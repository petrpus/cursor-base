/** Root epilog: printed after the command list for `cursor-kit --help` / `-h`. */
export const HELP_EPILOG_ROOT = `
Overview
  cursor-kit wires a consumer repository to a canonical cursor-base checkout: it creates a
  real project .cursor/ directory, symlinks selected shared subtrees, records what it owns in
  .cursor/.cursor-kit-managed.json, and can validate the result (doctor) or scaffold local files
  (init-project). It does not generate full docs/ai content; use the Cursor slash command
  /adopt-repo-docs after link.

Typical workflow (new repo)
  1. cursor-kit init-project --project <repo>
  2. cursor-kit link --shared <path-to-cursor-base> --project <repo>
  3. cursor-kit doctor --project <repo>
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

export const HELP_AFTER_LINK = `
What link does
  Creates project/.cursor/ if needed, then symlinks these shared names when the source exists:
    agents, commands, context, docs, hooks, rules
  Optional: README.md, manifest.md at the root of shared .cursor/
  With --include-local: also symlinks local/

  Never symlinks (must stay repo-local files):
    .cursor/environment.json, .cursor/mcp.json, .cursor/hooks.json

Safety
  Does not replace real files or directories with symlinks. Wrong symlinks that are already
  managed can be replaced only with --force. Refuses if project/.cursor is itself a symlink
  (legacy layout); migrate using docs/dev/cursor-kit.md.

Examples
  cursor-kit link --project ~/Code/my-app
  cursor-kit link --shared ~/Code/cursor-base --project . --dry-run
  cursor-kit link --shared ~/Code/cursor-base --include-local --project .
`;

export const HELP_AFTER_UNLINK = `
What unlink does
  Reads .cursor/.cursor-kit-managed.json, verifies each listed path is a symlink pointing at
  the recorded shared root, then removes only those symlinks and deletes the manifest.
  Local files (mcp.json, hooks.json, etc.) are never removed.

  Without a manifest, unlink refuses. --force does not enable unsafe manifest-less removal.

Examples
  cursor-kit unlink --project . --dry-run
  cursor-kit unlink --project ~/Code/my-app
`;

export const HELP_AFTER_DOCTOR = `
What doctor does
  Checks that project/.cursor exists and is not a whole-directory symlink, resolves the shared
  toolkit path, validates expected symlinks against the shared tree, and reports optional local
  files. If a managed manifest exists, warns when core docs/ai entry files are still missing
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
What init-project does
  Creates missing repo-local files only (unless --force): .cursor/*.json templates, AGENTS.md,
  and minimal docs/ai stubs. Does not run link and does not touch shared symlinks.

Examples
  cursor-kit init-project --project . --dry-run
  cursor-kit init-project --project ~/Code/my-app --force
`;
