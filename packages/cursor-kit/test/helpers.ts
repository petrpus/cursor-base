import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_PUBLIC_CURSOR_BASE_REPO, PUBLIC_CURSOR_BASE_BRANCH } from "../src/constants.js";
import type { Ui } from "../src/ui/create-ui.js";

export async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function rmrf(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function writeMinimalShared(sharedRoot: string): Promise<void> {
  const dirs = ["agents", "commands", "context", "docs", "hooks", "rules"];
  for (const d of dirs) {
    await mkdir(join(sharedRoot, d), { recursive: true });
    await writeFile(join(sharedRoot, d, ".keep"), "", "utf8");
  }
  await writeFile(join(sharedRoot, "README.md"), "# shared\n", "utf8");
  await writeFile(join(sharedRoot, "manifest.md"), "# manifest\n", "utf8");
}

export async function installFakeGitClone(fakeSharedRoot: string): Promise<() => Promise<void>> {
  const fakeBinDir = await makeTempDir("ck-fake-git-");
  const gitScriptPath = join(fakeBinDir, "git");
  const script = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    'if [ "$1" = "clone" ]; then',
    '  target="${@: -1}"',
    `  repo_expected="https://github.com/${DEFAULT_PUBLIC_CURSOR_BASE_REPO}.git"`,
    `  branch_expected="${PUBLIC_CURSOR_BASE_BRANCH}"`,
    '  found_repo="false"',
    '  found_branch="false"',
    '  for a in "$@"; do',
    '    if [ "$a" = "$repo_expected" ]; then found_repo="true"; fi',
    '    if [ "$a" = "$branch_expected" ]; then found_branch="true"; fi',
    "  done",
    '  if [ "$found_repo" != "true" ]; then',
    '    echo "unexpected repo argument" >&2',
    "    exit 10",
    "  fi",
    '  if [ "$found_branch" != "true" ]; then',
    '    echo "unexpected branch argument" >&2',
    "    exit 11",
    "  fi",
    `  mkdir -p "$target/.cursor" && cp -a "${fakeSharedRoot}/." "$target/.cursor/"`,
    "  exit 0",
    "fi",
    'echo "unexpected git command" >&2',
    "exit 12",
    "",
  ].join("\n");
  await writeFile(gitScriptPath, script, { encoding: "utf8", mode: 0o755 });
  const originalPath = process.env.PATH ?? "";
  process.env.PATH = `${fakeBinDir}:${originalPath}`;
  return async () => {
    process.env.PATH = originalPath;
    await rmrf(fakeBinDir);
  };
}

export function createTestUi(): Ui {
  return {
    useColor: false,
    icons: { ok: "ok", err: "err", warn: "warn", arrow: ">", info: "i" },
    title: () => {},
    section: () => {},
    rule: () => {},
    dim: (text: string) => text,
    success: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    line: () => {},
    table: () => "",
    printTable: () => {},
    keyValue: () => {},
  };
}
