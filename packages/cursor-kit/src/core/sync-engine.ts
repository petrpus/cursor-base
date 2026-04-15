import { copyFile, lstat, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { getCliVersion } from "../version.js";
import type { SharedSourceKind } from "../constants.js";
import { buildLinkNames } from "./link-targets.js";
import {
  copyEntryFromSource,
  digestFileContent,
  listRegularFilesUnderManagedRoot,
} from "./copy-utils.js";
import { isSymlink, pathExists, safeRealpath } from "./fs-utils.js";
import {
  MANIFEST_VERSION,
  isLegacyCopyManifest,
  isManifestV3,
  readManifest,
  writeManifest,
  type ManagedEntry,
  type ManagedFileRecord,
  type ManagedManifest,
} from "./manifest.js";
import { updateCopyModeGitIgnore } from "./copy-gitignore.js";

export type RootSyncRow = {
  name: string;
  kind: "dir" | "file";
  status:
    | "created"
    | "replaced"
    | "unchanged"
    | "skipped_missing_source"
    | "would_create"
    | "would_replace"
    | "would_skip_missing_source"
    | "conflict_not_symlink"
    | "conflict_wrong_symlink";
  detail: string;
};

export type FileSyncRow = {
  root: string;
  rel: string;
  status:
    | "created"
    | "updated"
    | "deleted"
    | "unchanged"
    | "skipped_user_edit"
    | "skipped_orphan"
    | "would_create"
    | "would_update"
    | "would_delete"
    | "would_skip_user_edit";
  detail: string;
};

export type SyncEngineResult = {
  rootRows: RootSyncRow[];
  fileRows: FileSyncRow[];
  errorMessages: string[];
  wroteManifest: boolean;
};

export type SyncEngineInput = {
  projectRoot: string;
  sharedRoot: string;
  includeLocal: boolean;
  dryRun: boolean;
  /** Replace symlink / unmanaged roots / overwrite user edits when true. */
  force: boolean;
  /** When false, files that differ from the last manifest hash are not overwritten from shared. */
  forceContent: boolean;
  sourceKind: SharedSourceKind;
  sourceRepo?: string;
  sourceRef?: string;
  /**
   * When set (e.g. `cursor-kit update`), only these top-level names under `.cursor/` are reconciled.
   * `init` omits this to process the full default kit list from shared.
   */
  onlyManagedRoots?: string[];
};

export async function ensureProjectCursorDir(projectRoot: string): Promise<string | undefined> {
  const cursorDir = join(projectRoot, ".cursor");
  if (!(await pathExists(cursorDir))) {
    return undefined;
  }
  const st = await lstat(cursorDir);
  if (st.isSymbolicLink()) {
    const target = await safeRealpath(cursorDir);
    return (
      `Refusing to operate: ${cursorDir} is a symlink${target ? ` → ${target}` : ""}. ` +
      `Remove the symlink, create a real directory, then run cursor-kit init. See docs/dev/cursor-kit.md.`
    );
  }
  if (!st.isDirectory()) {
    return `Refusing to operate: ${cursorDir} exists but is not a directory.`;
  }
  return undefined;
}

export async function ensureProjectCursorDirCreated(projectRoot: string): Promise<string | undefined> {
  const cursorDir = join(projectRoot, ".cursor");
  const err = await ensureProjectCursorDir(projectRoot);
  if (err) return err;
  if (!(await pathExists(cursorDir))) {
    await mkdir(cursorDir, { recursive: true });
  }
  return undefined;
}

export function fileKey(root: string, rel: string): string {
  return `${root}\n${rel}`;
}

export function destPathForRootRel(projectRoot: string, root: string, rel: string): string {
  if (rel === "") {
    return join(projectRoot, ".cursor", root);
  }
  return join(projectRoot, ".cursor", root, ...rel.split("/"));
}

async function buildFileIndexFromDisk(
  projectRoot: string,
  roots: string[],
): Promise<{ records: ManagedFileRecord[]; errors: string[] }> {
  const records: ManagedFileRecord[] = [];
  const errors: string[] = [];
  for (const root of roots) {
    const abs = join(projectRoot, ".cursor", root);
    if (!(await pathExists(abs))) continue;
    try {
      const listed = await listRegularFilesUnderManagedRoot(root, abs);
      for (const f of listed) {
        const hash = await digestFileContent(f.absPath);
        records.push({ root, rel: f.rel, hash });
      }
    } catch (e) {
      errors.push(`${root}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  records.sort((a, b) => fileKey(a.root, a.rel).localeCompare(fileKey(b.root, b.rel)));
  return { records, errors };
}

function finalizeRootRow(row: RootSyncRow, dryRun: boolean): RootSyncRow {
  if (dryRun) return row;
  if (row.status === "would_skip_missing_source") return { ...row, status: "skipped_missing_source" };
  if (row.status === "would_create") return { ...row, status: "created" };
  if (row.status === "would_replace") return { ...row, status: "replaced" };
  return row;
}

function finalizeFileRow(row: FileSyncRow, dryRun: boolean): FileSyncRow {
  if (dryRun) return row;
  if (row.status === "would_create") return { ...row, status: "created" };
  if (row.status === "would_update") return { ...row, status: "updated" };
  if (row.status === "would_delete") return { ...row, status: "deleted" };
  if (row.status === "would_skip_user_edit") return { ...row, status: "skipped_user_edit" };
  return row;
}

type RootPlan = { name: string; kind: "dir" | "file"; action: "skip_missing" | "full_copy" | "none" };

async function planRootSync(params: {
  name: string;
  kind: "dir" | "file";
  sharedRoot: string;
  projectRoot: string;
  force: boolean;
  existingManifest: ManagedManifest | undefined;
}): Promise<{ row: RootSyncRow; plan: RootPlan }> {
  const { name, kind, sharedRoot, projectRoot, force, existingManifest } = params;
  const source = join(sharedRoot, name);
  const dest = join(projectRoot, ".cursor", name);

  if (!(await pathExists(source))) {
    return {
      row: { name, kind, status: "would_skip_missing_source", detail: `source missing: ${source}` },
      plan: { name, kind, action: "skip_missing" },
    };
  }

  const sourceReal = (await safeRealpath(source)) ?? source;

  if (!(await pathExists(dest))) {
    return {
      row: { name, kind, status: "would_create", detail: `→ ${sourceReal}` },
      plan: { name, kind, action: "full_copy" },
    };
  }

  if (await isSymlink(dest)) {
    if (!force) {
      const cur = await safeRealpath(dest);
      return {
        row: {
          name,
          kind,
          status: "conflict_wrong_symlink",
          detail: `symlink present${cur ? ` → ${cur}` : ""}; use --force to replace with copied content`,
        },
        plan: { name, kind, action: "skip_missing" },
      };
    }
    return {
      row: { name, kind, status: "would_replace", detail: "replace symlink with copied content" },
      plan: { name, kind, action: "full_copy" },
    };
  }

  if (force) {
    return {
      row: { name, kind, status: "would_replace", detail: "replace with copied content (--force)" },
      plan: { name, kind, action: "full_copy" },
    };
  }

  if (
    existingManifest &&
    (isManifestV3(existingManifest) || isLegacyCopyManifest(existingManifest)) &&
    existingManifest.managed.some((m) => m.path === name)
  ) {
    return {
      row: { name, kind, status: "unchanged", detail: "per-file reconcile only" },
      plan: { name, kind, action: "none" },
    };
  }

  return {
    row: {
      name,
      kind,
      status: "conflict_not_symlink",
      detail: "exists and is not a symlink (repo-specific content); use --force to replace",
    },
    plan: { name, kind, action: "skip_missing" },
  };
}

export async function runSyncEngine(input: SyncEngineInput): Promise<SyncEngineResult> {
  const errorMessages: string[] = [];
  const fileRows: FileSyncRow[] = [];

  const preErr = await ensureProjectCursorDirCreated(input.projectRoot);
  if (preErr) {
    return { rootRows: [], fileRows: [], errorMessages: [preErr], wroteManifest: false };
  }

  const sourceRootReal = (await safeRealpath(input.sharedRoot)) ?? resolve(input.sharedRoot);
  const destRootAbs = join(input.projectRoot, ".cursor");
  const { dirs, files } = buildLinkNames({ includeLocal: input.includeLocal });
  const existingManifest = await readManifest(input.projectRoot);

  const onlySet = input.onlyManagedRoots ? new Set(input.onlyManagedRoots) : undefined;
  const selectedDirs = onlySet ? dirs.filter((name) => onlySet.has(name)) : dirs;
  const selectedFiles = onlySet ? files.filter((name) => onlySet.has(name)) : files;

  const rootPlans: { name: string; kind: "dir" | "file"; plan: RootPlan; baseRow: RootSyncRow }[] = [];

  for (const name of selectedDirs) {
    const { row, plan } = await planRootSync({
      name,
      kind: "dir",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
      existingManifest,
    });
    rootPlans.push({ name, kind: "dir", plan, baseRow: row });
  }
  for (const name of selectedFiles) {
    const { row, plan } = await planRootSync({
      name,
      kind: "file",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
      existingManifest,
    });
    rootPlans.push({ name, kind: "file", plan, baseRow: row });
  }

  const blocking = rootPlans.filter(
    (x) => x.baseRow.status === "conflict_not_symlink" || x.baseRow.status === "conflict_wrong_symlink",
  );
  for (const b of blocking) {
    errorMessages.push(`${b.name}: ${b.baseRow.detail}`);
  }
  if (blocking.length > 0) {
    return {
      rootRows: rootPlans.map((x) => x.baseRow),
      fileRows: [],
      errorMessages,
      wroteManifest: false,
    };
  }

  if (!input.dryRun) {
    for (const item of rootPlans) {
      if (item.plan.action !== "full_copy") continue;
      const dest = join(input.projectRoot, ".cursor", item.name);
      const sourcePath = join(input.sharedRoot, item.name);
      await copyEntryFromSource({
        sourcePath,
        destPath: dest,
        sourceRoot: sourceRootReal,
        destRoot: destRootAbs,
      });
    }
  }

  const manifestMap = new Map<string, ManagedFileRecord>();
  if (existingManifest?.files) {
    for (const f of existingManifest.files) {
      manifestMap.set(fileKey(f.root, f.rel), f);
    }
  }

  const rootsToSyncFiles: string[] = [];
  for (const x of rootPlans) {
    if (x.plan.action === "skip_missing") continue;
    if (await pathExists(join(input.sharedRoot, x.name))) {
      rootsToSyncFiles.push(x.name);
    }
  }

  const sharedFileKeys = new Set<string>();

  for (const root of rootsToSyncFiles) {
    const sourceAbs = join(input.sharedRoot, root);
    let listed: Awaited<ReturnType<typeof listRegularFilesUnderManagedRoot>>;
    try {
      listed = await listRegularFilesUnderManagedRoot(root, sourceAbs);
    } catch (e) {
      errorMessages.push(`${root}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    for (const f of listed) {
      const key = fileKey(root, f.rel);
      sharedFileKeys.add(key);
      const sharedHash = await digestFileContent(f.absPath);
      const man = manifestMap.get(key);
      const destAbs = destPathForRootRel(input.projectRoot, root, f.rel);

      if (!(await pathExists(destAbs))) {
        fileRows.push({
          root,
          rel: f.rel,
          status: "would_create",
          detail: "new file from shared",
        });
        if (!input.dryRun) {
          await mkdir(dirname(destAbs), { recursive: true });
          await copyFile(f.absPath, destAbs);
        }
        manifestMap.set(key, { root, rel: f.rel, hash: sharedHash });
        continue;
      }

      let diskHash: string;
      try {
        diskHash = await digestFileContent(destAbs);
      } catch {
        fileRows.push({
          root,
          rel: f.rel,
          status: "would_skip_user_edit",
          detail: "could not read destination",
        });
        continue;
      }

      if (man === undefined) {
        if (diskHash === sharedHash) {
          fileRows.push({ root, rel: f.rel, status: "unchanged", detail: "matches shared" });
          manifestMap.set(key, { root, rel: f.rel, hash: sharedHash });
        } else if (input.forceContent) {
          fileRows.push({
            root,
            rel: f.rel,
            status: "would_update",
            detail: "orphan diverged; --force overwrite",
          });
          if (!input.dryRun) {
            await mkdir(dirname(destAbs), { recursive: true });
            await copyFile(f.absPath, destAbs);
          }
          manifestMap.set(key, { root, rel: f.rel, hash: sharedHash });
        } else {
          fileRows.push({
            root,
            rel: f.rel,
            status: "would_skip_user_edit",
            detail: "local file not in manifest; skipped (use --force to overwrite)",
          });
        }
        continue;
      }

      if (diskHash !== man.hash) {
        if (input.forceContent) {
          fileRows.push({
            root,
            rel: f.rel,
            status: "would_update",
            detail: "user edit; --force overwrite",
          });
          if (!input.dryRun) {
            await mkdir(dirname(destAbs), { recursive: true });
            await copyFile(f.absPath, destAbs);
          }
          manifestMap.set(key, { root, rel: f.rel, hash: sharedHash });
        } else {
          fileRows.push({
            root,
            rel: f.rel,
            status: "would_skip_user_edit",
            detail: "user edit vs manifest; skipped",
          });
        }
        continue;
      }

      if (sharedHash !== man.hash) {
        fileRows.push({
          root,
          rel: f.rel,
          status: "would_update",
          detail: "upstream changed",
        });
        if (!input.dryRun) {
          await mkdir(dirname(destAbs), { recursive: true });
          await copyFile(f.absPath, destAbs);
        }
        manifestMap.set(key, { root, rel: f.rel, hash: sharedHash });
      } else {
        fileRows.push({ root, rel: f.rel, status: "unchanged", detail: "in sync" });
      }
    }
  }

  const manifestKeysToConsider = [...manifestMap.keys()].sort();
  for (const key of manifestKeysToConsider) {
    const rec = manifestMap.get(key);
    if (!rec || sharedFileKeys.has(key)) continue;
    const destAbs = destPathForRootRel(input.projectRoot, rec.root, rec.rel);
    if (!(await pathExists(destAbs))) {
      manifestMap.delete(key);
      continue;
    }
    let diskHash: string;
    try {
      diskHash = await digestFileContent(destAbs);
    } catch {
      continue;
    }
    if (diskHash === rec.hash) {
      fileRows.push({
        root: rec.root,
        rel: rec.rel,
        status: "would_delete",
        detail: "removed in shared",
      });
      if (!input.dryRun) {
        await rm(destAbs, { force: true });
      }
      manifestMap.delete(key);
    } else if (input.forceContent) {
      fileRows.push({
        root: rec.root,
        rel: rec.rel,
        status: "would_delete",
        detail: "removed in shared; --force delete local",
      });
      if (!input.dryRun) {
        await rm(destAbs, { force: true });
      }
      manifestMap.delete(key);
    } else {
      fileRows.push({
        root: rec.root,
        rel: rec.rel,
        status: "would_skip_user_edit",
        detail: "removed in shared but local file diverged; skipped",
      });
    }
  }

  const rootRows = rootPlans.map((x) => finalizeRootRow(x.baseRow, input.dryRun));
  const finalizedFileRows = fileRows.map((r) => finalizeFileRow(r, input.dryRun));

  const managedNames = rootPlans
    .filter((x) => x.plan.action !== "skip_missing")
    .map((x) => x.name)
    .sort();

  const managedEntries: ManagedEntry[] = managedNames.map((path) => ({
    path,
    kind: selectedDirs.includes(path) ? "dir" : "file",
    mode: "copy" as const,
    sourcePath: path,
  }));

  let wroteManifest = false;
  if (!input.dryRun) {
    const { records: diskRecords, errors: idxErrs } = await buildFileIndexFromDisk(input.projectRoot, managedNames);
    for (const m of idxErrs) {
      errorMessages.push(m);
    }
    if (idxErrs.length > 0) {
      return { rootRows, fileRows: finalizedFileRows, errorMessages, wroteManifest: false };
    }

    const manifest: ManagedManifest = {
      version: MANIFEST_VERSION,
      cliVersion: getCliVersion(),
      mode: "copy",
      source: {
        kind: input.sourceKind,
        sharedRoot: sourceRootReal,
        repo: input.sourceRepo,
        ref: input.sourceRef,
      },
      managed: managedEntries,
      files: diskRecords,
    };
    await writeManifest(input.projectRoot, manifest);
    await updateCopyModeGitIgnore({
      projectRoot: input.projectRoot,
      mode: "copy",
      managedEntries: managedNames,
    });
    wroteManifest = true;
  }

  return {
    rootRows,
    fileRows: finalizedFileRows,
    errorMessages,
    wroteManifest,
  };
}
