/** File written under project `.cursor/` listing symlinks managed by this tool. */
export const MANAGED_MANIFEST_RELATIVE = ".cursor-kit-managed.json";

/** Environment variable: path to cursor-base repository root (directory containing `.cursor/`). */
export const ENV_CURSOR_BASE_DIR = "CURSOR_BASE_DIR";

/** Public cursor-base repository used when --source public is selected. */
export const DEFAULT_PUBLIC_CURSOR_BASE_REPO = "cursor-sh/cursor-base";
export const PUBLIC_CURSOR_BASE_BRANCH = "main";

export const COPY_MODE_GITIGNORE_FILENAME = ".gitignore";
export const COPY_MODE_GITIGNORE_BEGIN = "# BEGIN cursor-kit managed copy";
export const COPY_MODE_GITIGNORE_END = "# END cursor-kit managed copy";

export const DEFAULT_LINK_DIRS = [
  "agents",
  "commands",
  "context",
  "docs",
  "hooks",
  "rules",
  "skills",
] as const;

export const DEFAULT_LINK_FILES = ["README.md", "manifest.md"] as const;

/** Must remain project-local and should never be symlinked or managed as copied shared entries. */
export const LOCAL_ONLY_CURSOR_FILES = ["environment.json", "mcp.json", "hooks.json"] as const;

export type LinkMode = "symlink" | "copy";
export type SharedSourceKind = "local" | "public";

export type DefaultLinkDir = (typeof DEFAULT_LINK_DIRS)[number];
