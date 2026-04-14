import { lstat, readlink, realpath } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

export async function pathExists(p: string): Promise<boolean> {
  try {
    await lstat(p);
    return true;
  } catch {
    return false;
  }
}

export async function isSymlink(p: string): Promise<boolean> {
  try {
    const s = await lstat(p);
    return s.isSymbolicLink();
  } catch {
    return false;
  }
}

export async function isDirectory(p: string): Promise<boolean> {
  try {
    const s = await lstat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function safeRealpath(p: string): Promise<string | undefined> {
  try {
    return await realpath(p);
  } catch {
    return undefined;
  }
}

export async function readSymlinkTarget(p: string): Promise<string | undefined> {
  try {
    return await readlink(p);
  } catch {
    return undefined;
  }
}

/** Resolve symlink target as absolute path (relative targets resolved from link's directory). */
export async function resolveSymlinkAbsolute(linkPath: string): Promise<string | undefined> {
  const rel = await readSymlinkTarget(linkPath);
  if (rel === undefined) return undefined;
  if (rel.startsWith("/")) return rel;
  return join(dirname(linkPath), rel);
}

export function normalizePosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

export function pathsEqual(a: string, b: string): boolean {
  return normalizePosixPath(a) === normalizePosixPath(b);
}

/** True if `target` is the same file as `expected` after realpath (when both exist). */
export async function symlinkPointsToRealpath(
  linkPath: string,
  expectedReal: string,
): Promise<boolean> {
  const resolved = await safeRealpath(linkPath);
  const expected = await safeRealpath(expectedReal);
  if (!resolved || !expected) return false;
  return pathsEqual(resolved, expected);
}

export function relativePathForDisplay(fromDir: string, toPath: string): string {
  try {
    return relative(fromDir, toPath) || ".";
  } catch {
    return toPath;
  }
}
