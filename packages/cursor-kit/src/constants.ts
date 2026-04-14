/** File written under project `.cursor/` listing symlinks managed by this tool. */
export const MANAGED_MANIFEST_RELATIVE = ".cursor-kit-managed.json";

/** Environment variable: path to cursor-base repository root (directory containing `.cursor/`). */
export const ENV_CURSOR_BASE_DIR = "CURSOR_BASE_DIR";

export const DEFAULT_LINK_DIRS = [
  "agents",
  "commands",
  "context",
  "docs",
  "hooks",
  "rules",
] as const;

export const DEFAULT_LINK_FILES = ["README.md", "manifest.md"] as const;

export type DefaultLinkDir = (typeof DEFAULT_LINK_DIRS)[number];
