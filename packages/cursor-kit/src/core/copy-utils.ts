import { copyFile, lstat, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, posix, resolve } from "node:path";

function assertContained(root: string, candidate: string): void {
  const rootAbs = resolve(root);
  const candidateAbs = resolve(candidate);
  if (candidateAbs === rootAbs) return;
  if (!candidateAbs.startsWith(`${rootAbs}/`)) {
    throw new Error(`Path escapes root: ${candidateAbs} (root ${rootAbs})`);
  }
}

async function digestFile(path: string): Promise<string> {
  return digestFileContent(path);
}

/** Content hash for a single regular file (used by manifest per-file index). */
export async function digestFileContent(path: string): Promise<string> {
  const hash = createHash("sha256");
  const body = await readFile(path);
  hash.update("F\n");
  hash.update(body);
  return `sha256:${hash.digest("hex")}`;
}

async function digestDir(path: string): Promise<string> {
  const hash = createHash("sha256");
  hash.update("D\n");
  const entries = await readdir(path, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to digest symlink in source: ${child}`);
    }
    const childDigest = await digestPath(child);
    hash.update(`${entry.name}\n${childDigest}\n`);
  }
  return `sha256:${hash.digest("hex")}`;
}

export async function digestPath(path: string): Promise<string> {
  const st = await lstat(path);
  if (st.isSymbolicLink()) {
    throw new Error(`Refusing to digest symlink: ${path}`);
  }
  if (st.isDirectory()) {
    return digestDir(path);
  }
  if (st.isFile()) {
    return digestFile(path);
  }
  throw new Error(`Unsupported source entry type: ${path}`);
}

async function copyDirContents(srcDir: string, destDir: string, sourceRoot: string, destRoot: string): Promise<void> {
  const entries = await readdir(srcDir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const srcChild = join(srcDir, entry.name);
    const destChild = join(destDir, entry.name);
    assertContained(sourceRoot, srcChild);
    assertContained(destRoot, destChild);
    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to copy symlink from source: ${srcChild}`);
    }
    if (entry.isDirectory()) {
      await mkdir(destChild, { recursive: true });
      await copyDirContents(srcChild, destChild, sourceRoot, destRoot);
      continue;
    }
    if (entry.isFile()) {
      await mkdir(dirname(destChild), { recursive: true });
      await copyFile(srcChild, destChild);
      continue;
    }
    throw new Error(`Unsupported source entry type: ${srcChild}`);
  }
}

export async function copyEntryFromSource(params: {
  sourcePath: string;
  destPath: string;
  sourceRoot: string;
  destRoot: string;
}): Promise<void> {
  const { sourcePath, destPath, sourceRoot, destRoot } = params;
  assertContained(sourceRoot, sourcePath);
  assertContained(destRoot, destPath);

  const st = await lstat(sourcePath);
  if (st.isSymbolicLink()) {
    throw new Error(`Refusing to copy symlink from source: ${sourcePath}`);
  }

  await rm(destPath, { recursive: true, force: true });
  if (st.isDirectory()) {
    await mkdir(destPath, { recursive: true });
    await copyDirContents(sourcePath, destPath, sourceRoot, destRoot);
    return;
  }
  if (st.isFile()) {
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(sourcePath, destPath);
    return;
  }
  throw new Error(`Unsupported source entry type: ${sourcePath}`);
}

export type ListedFile = { rel: string; absPath: string };

/**
 * Recursively list regular files under `absRoot` (directory) or a single file.
 * `rootName` is the managed top-level name (e.g. `agents`); `rel` paths use `/` and are relative to that root.
 */
export async function listRegularFilesUnderManagedRoot(rootName: string, absRoot: string): Promise<ListedFile[]> {
  const out: ListedFile[] = [];
  const st = await lstat(absRoot);
  if (st.isSymbolicLink()) {
    throw new Error(`Refusing to walk symlink: ${absRoot}`);
  }
  if (st.isFile()) {
    // Managed file root (e.g. `README.md`): single file; use empty `rel` for the index key.
    void rootName;
    out.push({ rel: "", absPath: absRoot });
    return out;
  }
  if (!st.isDirectory()) {
    throw new Error(`Unsupported entry type: ${absRoot}`);
  }

  async function walk(dir: string, relPrefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      const rel = relPrefix ? posix.join(relPrefix, entry.name) : entry.name;
      if (entry.isSymbolicLink()) {
        throw new Error(`Refusing to walk symlink in managed tree: ${abs}`);
      }
      if (entry.isDirectory()) {
        await walk(abs, rel);
      } else if (entry.isFile()) {
        out.push({ rel, absPath: abs });
      } else {
        throw new Error(`Unsupported entry type: ${abs}`);
      }
    }
  }

  await walk(absRoot, "");
  return out;
}
