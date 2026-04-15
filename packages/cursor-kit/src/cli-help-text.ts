/** Root epilog: printed after the command list for `cursor-kit --help` / `-h`. */
export const HELP_EPILOG_ROOT = `
Overview
  cursor-kit wires a consumer repository to a canonical cursor-base checkout: it creates a
  real project .cursor/ directory, materializes selected shared entries as symlinks or copied
  content, records what it owns in .cursor/.cursor-kit-managed.json, and can validate the result
  (doctor) or scaffold local files (init-project). It does not generate full docs/ai content;
  use the Cursor slash command /adopt-repo-docs after link.

Typical workflow (new repo)
  1. cursor-kit init-project --project <repo>
  2. cursor-kit link --shared <path-to-cursor-base> --project <repo> [--mode copy]
  3. cursor-kit doctor --project <repo>
  4. Optional for copy mode: cursor-kit update --project <repo>
  5. In Cursor: /adopt-repo-docs (and /adopt-design-system if you have a UI stack); skip docs step if you maintain docs/ai yourself
  6. Optional: /adopt-cloud-env only if you use Cursor Cloud agents (separate from adopt-repo-docs)

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
  Creates project/.cursor/ if needed, then materializes these shared names when the source exists:
    agents, commands, context, docs, hooks, rules
  Optional: README.md, manifest.md at the root of shared .cursor/
  With --include-local: also includes local/

  Never symlinks (must stay repo-local files):
    .cursor/environment.json, .cursor/mcp.json, .cursor/hooks.json

Safety
  Does not replace unmanaged real files or directories. Wrong managed symlinks can be replaced
  only with --force. In copy mode, existing managed copy entries are not refreshed by link;
  use cursor-kit update. Refuses if project/.cursor is itself a symlink
  (legacy layout); migrate using docs/dev/cursor-kit.md.

Examples
  cursor-kit link --project ~/Code/my-app
  cursor-kit link --shared ~/Code/cursor-base --project . --dry-run
  cursor-kit link --shared ~/Code/cursor-base --include-local --project .
  cursor-kit link --project . --mode copy
  cursor-kit link --project . --source public --mode copy
`;

export const HELP_AFTER_UNLINK = `
What unlink does
  Reads .cursor/.cursor-kit-managed.json and removes only managed entries:
    - symlink mode: removes managed symlinks that point at the recorded shared root
    - copy mode: removes managed copied entries
  Local files (mcp.json, hooks.json, etc.) are never removed.

  Without a manifest, unlink refuses. --force-without-manifest does not enable unsafe
  manifest-less removal (safety-restricted).
  For modified managed copies, unlink skips by default; use --force-remove-modified-copy
  to remove them.

Examples
  cursor-kit unlink --project . --dry-run
  cursor-kit unlink --project ~/Code/my-app
`;

export const HELP_AFTER_UPDATE = `
What update does
  Refreshes managed copied entries from source. This is separate from link so copy-mode users
  can control when source updates are applied.

  update always operates in copy mode and only refreshes managed copied entries.
  It does not overwrite unmanaged repo-local files.

Examples
  cursor-kit update --project .
  cursor-kit update --project . --dry-run
  cursor-kit update --project . --source public
`;

export const HELP_AFTER_DOCTOR = `
What doctor does
  Checks that project/.cursor exists and is not a whole-directory symlink, resolves the shared
  toolkit path, validates expected managed entries against the shared tree (symlink or copy mode),
  and reports optional local files. If a managed manifest exists, warns when core docs/ai entry files are still missing
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
