import { rm } from "node:fs/promises";
import { join } from "node:path";

import { manifestPath, readManifest } from "./manifest.js";
import { isSymlink, pathExists, symlinkPointsToRealpath } from "./fs-utils.js";

export type UnlinkRow = {
  name: string;
  status: "removed" | "would_remove" | "skipped_not_symlink" | "skipped_missing" | "skipped_wrong_target";
  detail: string;
};

export type UnlinkEngineResult = {
  rows: UnlinkRow[];
  errorMessages: string[];
  updatedManifest: boolean;
};

export type UnlinkEngineInput = {
  projectRoot: string;
  dryRun: boolean;
  /** When true, allow unlink even if manifest is missing (only use with care). */
  forceWithoutManifest: boolean;
};

export async function runUnlinkEngine(input: UnlinkEngineInput): Promise<UnlinkEngineResult> {
  const manifest = await readManifest(input.projectRoot);
  if (!manifest) {
    if (!input.forceWithoutManifest) {
      return {
        rows: [],
        errorMessages: [
          "No .cursor/.cursor-kit-managed.json found. Nothing to unlink. If you are sure, pass --force (see README).",
        ],
        updatedManifest: false,
      };
    }
    return {
      rows: [],
      errorMessages: ["Refusing: --force without manifest is not implemented for safety."],
      updatedManifest: false,
    };
  }

  const rows: UnlinkRow[] = [];
  const sharedRoot = manifest.sharedRoot;

  for (const name of manifest.managed) {
    const dest = join(input.projectRoot, ".cursor", name);
    if (!(await pathExists(dest))) {
      rows.push({ name, status: "skipped_missing", detail: "already absent" });
      continue;
    }
    if (!(await isSymlink(dest))) {
      rows.push({
        name,
        status: "skipped_not_symlink",
        detail: "not a symlink; leaving untouched",
      });
      continue;
    }
    const expected = join(sharedRoot, name);
    const ok = await symlinkPointsToRealpath(dest, expected);
    if (!ok) {
      rows.push({
        name,
        status: "skipped_wrong_target",
        detail: "symlink does not point to recorded shared root; leaving untouched",
      });
      continue;
    }
    if (input.dryRun) {
      rows.push({ name, status: "would_remove", detail: "symlink OK to remove" });
    } else {
      await rm(dest);
      rows.push({ name, status: "removed", detail: "removed symlink" });
    }
  }

  let updatedManifest = false;
  if (!input.dryRun) {
    try {
      await rm(manifestPath(input.projectRoot));
      updatedManifest = true;
    } catch {
      // ignore
    }
  }

  return { rows, errorMessages: [], updatedManifest };
}
