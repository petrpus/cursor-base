import { access, mkdtemp, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { constants as FsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  DEFAULT_PUBLIC_CURSOR_BASE_REPO,
  ENV_CURSOR_BASE_DIR,
  PUBLIC_CURSOR_BASE_BRANCH,
  type SharedSourceKind,
} from "../constants.js";
import { pathExists, safeRealpath } from "./fs-utils.js";
const execFileAsync = promisify(execFile);

const MARKERS = ["manifest.md", "rules"] as const;

async function isSharedCursorRoot(dir: string): Promise<boolean> {
  for (const m of MARKERS) {
    if (await pathExists(join(dir, m))) return true;
  }
  return false;
}

/**
 * Normalize user input to the shared `.cursor` directory.
 * Accepts either the cursor-base repo root or the `.cursor` directory itself.
 */
async function normalizeToSharedCursorDir(p: string): Promise<string> {
  const abs = resolve(p);
  if (await isSharedCursorRoot(abs)) return abs;
  const nested = join(abs, ".cursor");
  if (await pathExists(nested) && (await isSharedCursorRoot(nested))) return nested;
  return abs;
}

async function canReadDir(p: string): Promise<boolean> {
  try {
    await access(p, FsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walk from `startDir` upward looking for a directory named `cursor-base` with a valid `.cursor` inside.
 */
export async function autodetectSharedFromAncestors(startDir: string): Promise<string | undefined> {
  let cur = resolve(startDir);
  for (;;) {
    const candidate = join(cur, "cursor-base", ".cursor");
    if ((await canReadDir(candidate)) && (await isSharedCursorRoot(candidate))) {
      return await safeRealpath(candidate);
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return undefined;
}

export async function autodetectHomeDefault(): Promise<string | undefined> {
  const candidate = join(homedir(), "Code", "cursor-base", ".cursor");
  if ((await canReadDir(candidate)) && (await isSharedCursorRoot(candidate))) {
    return await safeRealpath(candidate);
  }
  return undefined;
}

export type ResolveSharedInput = {
  explicit?: string;
  envRepoRoot?: string;
  projectDir: string;
  sourceKind: SharedSourceKind | "local-or-public";
  sourceRepo?: string;
};

export type ResolveSharedResult =
  | {
      ok: true;
      sharedCursorDir: string;
      source: "flag" | "env" | "ancestor" | "home" | "public";
      sourceKind: SharedSourceKind;
      sourceRepo?: string;
      sourceRef?: string;
    }
  | { ok: false; reason: string };

async function resolveSharedFromPublicRepo(repo: string): Promise<ResolveSharedResult> {
  const tmpRoot = await mkdtemp(join(tmpdir(), "cursor-kit-public-"));
  const targetRepo = `https://github.com/${repo}.git`;
  try {
    await execFileAsync("git", ["clone", "--depth", "1", "--branch", PUBLIC_CURSOR_BASE_BRANCH, targetRepo, tmpRoot], {
      timeout: 180000,
    });
  } catch (error) {
    await rm(tmpRoot, { recursive: true, force: true });
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Failed to clone public source (${repo}@${PUBLIC_CURSOR_BASE_BRANCH}): ${message}` };
  }

  const sharedDir = join(tmpRoot, ".cursor");
  if (!(await isSharedCursorRoot(sharedDir))) {
    await rm(tmpRoot, { recursive: true, force: true });
    return {
      ok: false,
      reason: `Cloned public source is missing .cursor markers (manifest.md/rules): ${sharedDir}`,
    };
  }
  const real = (await safeRealpath(sharedDir)) ?? sharedDir;
  return {
    ok: true,
    sharedCursorDir: real,
    source: "public",
    sourceKind: "public",
    sourceRepo: repo,
    sourceRef: PUBLIC_CURSOR_BASE_BRANCH,
  };
}

export async function resolveSharedCursorDir(input: ResolveSharedInput): Promise<ResolveSharedResult> {
  if (input.sourceKind === "public") {
    const repo = input.sourceRepo ?? DEFAULT_PUBLIC_CURSOR_BASE_REPO;
    return resolveSharedFromPublicRepo(repo);
  }

  if (input.explicit) {
    const dir = await normalizeToSharedCursorDir(input.explicit);
    if (!(await isSharedCursorRoot(dir))) {
      return {
        ok: false,
        reason: `Shared path does not look like a cursor-base .cursor directory (missing manifest.md/rules): ${dir}`,
      };
    }
    const real = (await safeRealpath(dir)) ?? dir;
    return { ok: true, sharedCursorDir: real, source: "flag", sourceKind: "local" };
  }

  const env = input.envRepoRoot ?? process.env[ENV_CURSOR_BASE_DIR];
  if (env) {
    const dir = await normalizeToSharedCursorDir(env);
    if (!(await isSharedCursorRoot(dir))) {
      return {
        ok: false,
        reason: `${ENV_CURSOR_BASE_DIR} does not resolve to a valid shared .cursor directory: ${env} → ${dir}`,
      };
    }
    const real = (await safeRealpath(dir)) ?? dir;
    return { ok: true, sharedCursorDir: real, source: "env", sourceKind: "local" };
  }

  const fromAncestors = await autodetectSharedFromAncestors(input.projectDir);
  if (fromAncestors) {
    return { ok: true, sharedCursorDir: fromAncestors, source: "ancestor", sourceKind: "local" };
  }

  const fromHome = await autodetectHomeDefault();
  if (fromHome) {
    return { ok: true, sharedCursorDir: fromHome, source: "home", sourceKind: "local" };
  }

  if (input.sourceKind === "local-or-public") {
    const repo = input.sourceRepo ?? DEFAULT_PUBLIC_CURSOR_BASE_REPO;
    return resolveSharedFromPublicRepo(repo);
  }

  return {
    ok: false,
    reason:
      "Could not locate shared .cursor. Pass --shared, set CURSOR_BASE_DIR to the cursor-base repo root, or run from a path under a parent that contains cursor-base/.cursor.",
  };
}
