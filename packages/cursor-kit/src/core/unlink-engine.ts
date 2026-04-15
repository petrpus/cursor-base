import { rm } from "node:fs/promises";
import { join } from "node:path";

import { manifestPath, readManifest, writeManifest } from "./manifest.js";
import { isSymlink, pathExists, symlinkPointsToRealpath } from "./fs-utils.js";
import { digestPath } from "./copy-utils.js";
import { updateCopyModeGitIgnore } from "./copy-gitignore.js";

export type UnlinkRow = {
  name: string;
  status:
    | "removed"
    | "would_remove"
    | "skipped_not_symlink"
    | "skipped_missing"
    | "skipped_wrong_target"
    | "skipped_modified_copy";
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
  forceRemoveModifiedCopy: boolean;
};

export async function runUnlinkEngine(input: UnlinkEngineInput): Promise<UnlinkEngineResult> {
  const manifest = await readManifest(input.projectRoot);
  if (!manifest) {
    if (!input.forceWithoutManifest) {
      return {
        rows: [],
        errorMessages: [
          "No .cursor/.cursor-kit-managed.json found. Nothing to unlink. If you are sure, pass --force-without-manifest (see README).",
        ],
        updatedManifest: false,
      };
    }
    return {
      rows: [],
      errorMessages: ["Refusing: --force-without-manifest is not implemented for safety."],
      updatedManifest: false,
    };
  }

  const rows: UnlinkRow[] = [];
  const sharedRoot = manifest.source.sharedRoot;
  const remainingManaged = [...manifest.managed];

  for (const entry of manifest.managed) {
    const dest = join(input.projectRoot, ".cursor", entry.path);
    if (!(await pathExists(dest))) {
      rows.push({ name: entry.path, status: "skipped_missing", detail: "already absent" });
      if (!input.dryRun) {
        const idx = remainingManaged.findIndex((candidate) => candidate.path === entry.path);
        if (idx >= 0) remainingManaged.splice(idx, 1);
      }
      continue;
    }
    if (entry.mode === "copy") {
      if (entry.digest && !input.forceRemoveModifiedCopy) {
        let currentDigest: string | undefined;
        try {
          currentDigest = await digestPath(dest);
        } catch {
          currentDigest = undefined;
        }
        if (!currentDigest || currentDigest !== entry.digest) {
          rows.push({
            name: entry.path,
            status: "skipped_modified_copy",
            detail: "copied entry differs from managed digest; use --force-remove-modified-copy",
          });
          continue;
        }
      }
      if (input.dryRun) {
        rows.push({ name: entry.path, status: "would_remove", detail: "managed copy entry would be removed" });
      } else {
        await rm(dest, { recursive: true, force: true });
        rows.push({ name: entry.path, status: "removed", detail: "removed managed copy entry" });
        const idx = remainingManaged.findIndex((candidate) => candidate.path === entry.path);
        if (idx >= 0) remainingManaged.splice(idx, 1);
      }
      continue;
    }
    if (!(await isSymlink(dest))) {
      rows.push({
        name: entry.path,
        status: "skipped_not_symlink",
        detail: "not a symlink; leaving untouched",
      });
      continue;
    }
    const expected = join(sharedRoot, entry.path);
    const ok = await symlinkPointsToRealpath(dest, expected);
    if (!ok) {
      rows.push({
        name: entry.path,
        status: "skipped_wrong_target",
        detail: "symlink does not point to recorded shared root; leaving untouched",
      });
      continue;
    }
    if (input.dryRun) {
      rows.push({ name: entry.path, status: "would_remove", detail: "symlink OK to remove" });
    } else {
      await rm(dest);
      rows.push({ name: entry.path, status: "removed", detail: "removed symlink" });
      const idx = remainingManaged.findIndex((candidate) => candidate.path === entry.path);
      if (idx >= 0) remainingManaged.splice(idx, 1);
    }
  }

  let updatedManifest = false;
  if (!input.dryRun) {
    try {
      if (remainingManaged.length === 0) {
        await rm(manifestPath(input.projectRoot));
      } else {
        const mode = remainingManaged.some((entry) => entry.mode === "copy") ? "copy" : "symlink";
        await writeManifest(input.projectRoot, { ...manifest, mode, managed: remainingManaged });
      }
      const remainingCopyEntries = remainingManaged.filter((entry) => entry.mode === "copy").map((entry) => entry.path);
      await updateCopyModeGitIgnore({
        projectRoot: input.projectRoot,
        mode: remainingCopyEntries.length > 0 ? "copy" : "symlink",
        managedEntries: remainingCopyEntries,
      });
      updatedManifest = true;
    } catch {
      // ignore
    }
  }

  return { rows, errorMessages: [], updatedManifest };
}
