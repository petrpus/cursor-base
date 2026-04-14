import { lstat, mkdir, rm, symlink } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { getCliVersion } from "../version.js";
import { buildLinkNames } from "./link-targets.js";
import {
  isSymlink,
  pathExists,
  readSymlinkTarget,
  safeRealpath,
  symlinkPointsToRealpath,
} from "./fs-utils.js";
import { MANIFEST_VERSION, writeManifest, type ManagedManifest } from "./manifest.js";

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
}): Promise<{ row: LinkRow; planned: Planned }> {
  const { name, kind, sharedRoot, projectRoot, force } = params;
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

  if (await isSymlink(dest)) {
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

  const { dirs, files } = buildLinkNames({ includeLocal: input.includeLocal });
  const planned: { name: string; kind: "dir" | "file"; planned: Planned; baseRow: LinkRow }[] = [];

  for (const name of dirs) {
    const { row, planned: p } = await planEntry({
      name,
      kind: "dir",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
    });
    planned.push({ name, kind: "dir", planned: p, baseRow: row });
  }
  for (const name of files) {
    const { row, planned: p } = await planEntry({
      name,
      kind: "file",
      sharedRoot: input.sharedRoot,
      projectRoot: input.projectRoot,
      force: input.force,
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
        const rel = relative(dirname(dest), item.planned.sourceReal);
        await symlink(rel, dest);
      } else if (item.planned.op === "replace") {
        await rm(dest);
        const rel = relative(dirname(dest), item.planned.sourceReal);
        await symlink(rel, dest);
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

  const manifestManaged = planned
    .filter((x) => x.planned.op === "noop_ok" || x.planned.op === "create" || x.planned.op === "replace")
    .map((x) => x.name)
    .sort();

  let wroteManifest = false;
  if (!input.dryRun) {
    const manifest: ManagedManifest = {
      version: MANIFEST_VERSION,
      cliVersion: getCliVersion(),
      sharedRoot: (await safeRealpath(input.sharedRoot)) ?? resolve(input.sharedRoot),
      managed: manifestManaged,
    };
    await writeManifest(input.projectRoot, manifest);
    wroteManifest = true;
  }

  return { rows, managed: managedList, errorMessages, wroteManifest };
}
