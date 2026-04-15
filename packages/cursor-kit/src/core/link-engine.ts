import { lstat, mkdir, rm, symlink } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { getCliVersion } from "../version.js";
import {
  type LinkMode,
  type SharedSourceKind,
} from "../constants.js";
import { buildLinkNames } from "./link-targets.js";
import {
  isSymlink,
  pathExists,
  readSymlinkTarget,
  safeRealpath,
  symlinkPointsToRealpath,
} from "./fs-utils.js";
import {
  MANIFEST_VERSION,
  readManifest,
  writeManifest,
  type ManagedEntry,
  type ManagedManifest,
} from "./manifest.js";
import { copyEntryFromSource, digestPath } from "./copy-utils.js";
import { updateCopyModeGitIgnore } from "./copy-gitignore.js";

export type LinkRow = {
  name: string;
  kind: "dir" | "file";
  status:
    | "created"
    | "unchanged"
    | "replaced"
    | "skipped_missing_source"
    | "would_create"
    | "would_replace"
    | "would_skip_missing_source"
    | "conflict_not_symlink"
    | "conflict_wrong_symlink";
  detail: string;
};

export type LinkEngineResult = {
  rows: LinkRow[];
  managed: string[];
  errorMessages: string[];
  wroteManifest: boolean;
};

export type LinkEngineInput = {
  projectRoot: string;
  sharedRoot: string;
  includeLocal: boolean;
  dryRun: boolean;
  force: boolean;
  mode: LinkMode;
  /** When true, managed copy entries may be refreshed from source (used by update command). */
  refreshManagedCopy: boolean;
  /** Optional managed-entry subset for refresh/update workflows. */
  managedOnlyPaths?: string[];
  sourceKind: SharedSourceKind;
  sourceRepo?: string;
  sourceRef?: string;
};

async function ensureProjectCursorDir(projectRoot: string): Promise<string | undefined> {
  const cursorDir = join(projectRoot, ".cursor");
  if (!(await pathExists(cursorDir))) {
    return undefined;
  }
  const st = await lstat(cursorDir);
  if (st.isSymbolicLink()) {
    const target = await safeRealpath(cursorDir);
    return (
      `Refusing to operate: ${cursorDir} is a symlink${target ? ` → ${target}` : ""}. ` +
      `Remove the symlink, create a real directory, then run init-project and link. See docs/dev/cursor-kit.md.`
    );
  }
  if (!st.isDirectory()) {
    return `Refusing to operate: ${cursorDir} exists but is not a directory.`;
  }
  return undefined;
}

async function ensureProjectCursorDirCreated(projectRoot: string): Promise<string | undefined> {
  const cursorDir = join(projectRoot, ".cursor");
  const err = await ensureProjectCursorDir(projectRoot);
  if (err) return err;
  if (!(await pathExists(cursorDir))) {
    await mkdir(cursorDir, { recursive: true });
  }
  return undefined;
}

type Planned =
  | { op: "noop_ok" }
  | { op: "create"; sourceReal: string }
  | { op: "replace"; sourceReal: string }
  | { op: "skip_missing_source"; detail: string }
  | { op: "conflict_not_symlink"; detail: string }
  | { op: "conflict_wrong_symlink"; detail: string };

async function planEntry(params: {
  name: string;
  kind: "dir" | "file";
  sharedRoot: string;
  projectRoot: string;
  force: boolean;
  mode: LinkMode;
  refreshManagedCopy: boolean;
  existingManaged?: ManagedEntry;
}): Promise<{ row: LinkRow; planned: Planned }> {
  const { name, kind, sharedRoot, projectRoot, force, mode, refreshManagedCopy, existingManaged } = params;
  const source = join(sharedRoot, name);
  const dest = join(projectRoot, ".cursor", name);

  if (!(await pathExists(source))) {
    const detail = `source missing: ${source}`;
    return {
      row: { name, kind, status: "would_skip_missing_source", detail },
      planned: { op: "skip_missing_source", detail },
    };
  }

  const sourceReal = (await safeRealpath(source)) ?? source;

  if (!(await pathExists(dest))) {
    return {
      row: { name, kind, status: "would_create", detail: `→ ${relative(projectRoot, sourceReal)}` },
      planned: { op: "create", sourceReal },
    };
  }

  const destIsSymlink = await isSymlink(dest);
  if (mode === "symlink") {
    if (destIsSymlink) {
      const ok = await symlinkPointsToRealpath(dest, sourceReal);
      if (ok) {
        return { row: { name, kind, status: "unchanged", detail: "symlink OK" }, planned: { op: "noop_ok" } };
      }
      if (!force) {
        const cur = (await readSymlinkTarget(dest)) ?? "?";
        return {
          row: {
            name,
            kind,
            status: "conflict_wrong_symlink",
            detail: `points elsewhere (${cur}); use --force to replace`,
          },
          planned: {
            op: "conflict_wrong_symlink",
            detail: `wrong symlink`,
          },
        };
      }
      return {
        row: { name, kind, status: "would_replace", detail: "wrong symlink" },
        planned: { op: "replace", sourceReal },
      };
    }
    if (force && existingManaged?.mode === "copy") {
      return {
        row: { name, kind, status: "would_replace", detail: "replace managed copy with symlink" },
        planned: { op: "replace", sourceReal },
      };
    }
    return {
      row: {
        name,
        kind,
        status: "conflict_not_symlink",
        detail: "exists and is not a symlink (repo-specific content); not overwriting",
      },
      planned: { op: "conflict_not_symlink", detail: "not a symlink" },
    };
  }

  if (destIsSymlink) {
    const ok = await symlinkPointsToRealpath(dest, sourceReal);
    if (ok && existingManaged?.mode === "symlink" && force) {
      return {
        row: { name, kind, status: "would_replace", detail: "replace managed symlink with copied content" },
        planned: { op: "replace", sourceReal },
      };
    }
    if (!force || existingManaged?.mode !== "symlink") {
      const cur = (await readSymlinkTarget(dest)) ?? "?";
      return {
        row: {
          name,
          kind,
          status: "conflict_wrong_symlink",
          detail: `symlink present (${cur}); use --force to replace managed symlink`,
        },
        planned: {
          op: "conflict_wrong_symlink",
          detail: "symlink present in copy mode",
        },
      };
    }
    return {
      row: { name, kind, status: "would_replace", detail: "replace managed symlink with copied content" },
      planned: { op: "replace", sourceReal },
    };
  }

  if (existingManaged?.mode === "copy") {
    if (refreshManagedCopy) {
      return {
        row: { name, kind, status: "would_replace", detail: "refresh managed copied content from source" },
        planned: { op: "replace", sourceReal },
      };
    }
    return {
      row: { name, kind, status: "unchanged", detail: "managed copy present (link does not refresh)" },
      planned: { op: "noop_ok" },
    };
  }

  return {
    row: {
      name,
      kind,
      status: "conflict_not_symlink",
      detail: "exists and is not a symlink (repo-specific content); not overwriting",
    },
    planned: { op: "conflict_not_symlink", detail: "not a symlink" },
  };
}

function finalizeRowStatus(row: LinkRow, dryRun: boolean): LinkRow {
  if (dryRun) return row;
  if (row.status === "would_skip_missing_source") return { ...row, status: "skipped_missing_source" };
  if (row.status === "would_create") return { ...row, status: "created" };
  if (row.status === "would_replace") return { ...row, status: "replaced" };
  return row;
}

export async function runLinkEngine(input: LinkEngineInput): Promise<LinkEngineResult> {
  const errorMessages: string[] = [];

  const preErr = await ensureProjectCursorDirCreated(input.projectRoot);
  if (preErr) {
    return { rows: [], managed: [], errorMessages: [preErr], wroteManifest: false };
  }

  const sourceRootReal = (await safeRealpath(input.sharedRoot)) ?? resolve(input.sharedRoot);
  const { dirs, files } = buildLinkNames({ includeLocal: input.includeLocal });
  const managedOnlySet = input.managedOnlyPaths ? new Set(input.managedOnlyPaths) : undefined;
  const selectedDirs = managedOnlySet ? dirs.filter((name) => managedOnlySet.has(name)) : dirs;
  const selectedFiles = managedOnlySet ? files.filter((name) => managedOnlySet.has(name)) : files;
  const existingManifest = await readManifest(input.projectRoot);
  const existingManagedMap = new Map(existingManifest?.managed.map((entry) => [entry.path, entry]) ?? []);
  const planned: { name: string; kind: "dir" | "file"; planned: Planned; baseRow: LinkRow }[] = [];

  for (const name of selectedDirs) {
    const { row, planned: p } = await planEntry({
      name,
      kind: "dir",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
      mode: input.mode,
      refreshManagedCopy: input.refreshManagedCopy,
      existingManaged: existingManagedMap.get(name),
    });
    planned.push({ name, kind: "dir", planned: p, baseRow: row });
  }
  for (const name of selectedFiles) {
    const { row, planned: p } = await planEntry({
      name,
      kind: "file",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
      mode: input.mode,
      refreshManagedCopy: input.refreshManagedCopy,
      existingManaged: existingManagedMap.get(name),
    });
    planned.push({ name, kind: "file", planned: p, baseRow: row });
  }

  const blocking = planned.filter(
    (x) => x.planned.op === "conflict_not_symlink" || x.planned.op === "conflict_wrong_symlink",
  );
  for (const b of blocking) {
    errorMessages.push(`${b.name}: ${b.baseRow.detail}`);
  }

  if (blocking.length > 0) {
    const rows = planned.map((x) => x.baseRow);
    return { rows, managed: [], errorMessages, wroteManifest: false };
  }

  if (!input.dryRun) {
    for (const item of planned) {
      const dest = join(input.projectRoot, ".cursor", item.name);
      if (item.planned.op === "create") {
        if (input.mode === "symlink") {
          const rel = relative(dirname(dest), item.planned.sourceReal);
          await symlink(rel, dest);
        } else {
          await copyEntryFromSource({
            sourcePath: item.planned.sourceReal,
            destPath: dest,
            sourceRoot: sourceRootReal,
            destRoot: join(input.projectRoot, ".cursor"),
          });
        }
      } else if (item.planned.op === "replace") {
        await rm(dest, { recursive: true, force: true });
        if (input.mode === "symlink") {
          const rel = relative(dirname(dest), item.planned.sourceReal);
          await symlink(rel, dest);
        } else {
          await copyEntryFromSource({
            sourcePath: item.planned.sourceReal,
            destPath: dest,
            sourceRoot: sourceRootReal,
            destRoot: join(input.projectRoot, ".cursor"),
          });
        }
      }
    }
  }

  const rows = planned.map((x) => finalizeRowStatus(x.baseRow, input.dryRun));

  const managedList = planned
    .filter((x) => {
      if (input.dryRun) {
        return x.planned.op === "noop_ok" || x.planned.op === "create" || x.planned.op === "replace";
      }
      return x.planned.op === "noop_ok" || x.planned.op === "create" || x.planned.op === "replace";
    })
    .map((x) => x.name)
    .sort();

  const manifestManagedEntries: ManagedEntry[] = [];
  for (const item of planned) {
    if (!(item.planned.op === "noop_ok" || item.planned.op === "create" || item.planned.op === "replace")) {
      continue;
    }
    let digest: string | undefined;
    if (input.mode === "copy" && !input.dryRun) {
      const destPath = join(input.projectRoot, ".cursor", item.name);
      digest = await digestPath(destPath);
    }
    manifestManagedEntries.push({
      path: item.name,
      kind: item.kind,
      mode: input.mode,
      sourcePath: item.name,
      digest,
    });
  }

  let wroteManifest = false;
  if (!input.dryRun) {
    const manifest: ManagedManifest = {
      version: MANIFEST_VERSION,
      cliVersion: getCliVersion(),
      mode: input.mode,
      source: {
        kind: input.sourceKind,
        sharedRoot: sourceRootReal,
        repo: input.sourceRepo,
        ref: input.sourceRef,
      },
      managed: manifestManagedEntries,
    };
    await writeManifest(input.projectRoot, manifest);
    await updateCopyModeGitIgnore({
      projectRoot: input.projectRoot,
      mode: input.mode,
      managedEntries: input.mode === "copy" ? manifestManagedEntries.map((entry) => entry.path) : [],
    });
    wroteManifest = true;
  }

  return { rows, managed: managedList, errorMessages, wroteManifest };
}
