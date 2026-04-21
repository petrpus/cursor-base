import { join } from "node:path";

import { readManifest } from "./manifest.js";
import { digestFileContent } from "./copy-utils.js";
import { pathExists } from "./fs-utils.js";

export type DiffStatus =
  | "unchanged"
  | "modified-locally"
  | "ejected"
  | "missing-on-disk";

export type DiffRow = {
  root: string;
  rel: string;
  status: DiffStatus;
  detail: string;
};

export type DiffEngineResult = {
  rows: DiffRow[];
  errorMessages: string[];
};

export type DiffEngineInput = {
  projectRoot: string;
};

export async function runDiffEngine(input: DiffEngineInput): Promise<DiffEngineResult> {
  const manifest = await readManifest(input.projectRoot);
  if (!manifest) {
    return {
      rows: [],
      errorMessages: ["No managed manifest found. Run `cursor-kit init` first."],
    };
  }

  if (!manifest.files || manifest.files.length === 0) {
    return {
      rows: [],
      errorMessages: [
        "Manifest has no per-file index (v2 legacy). Run `cursor-kit update` to build it, then retry diff.",
      ],
    };
  }

  const rows: DiffRow[] = [];

  for (const entry of manifest.managed) {
    if (entry.ejected) {
      const filesForEntry = manifest.files.filter((f) => f.root === entry.path);
      for (const f of filesForEntry) {
        rows.push({
          root: entry.path,
          rel: f.rel,
          status: "ejected",
          detail: "locally owned — skipped by update",
        });
      }
      continue;
    }

    const filesForEntry = manifest.files.filter((f) => f.root === entry.path);

    if (filesForEntry.length === 0) {
      // Root entry with no file records — treat as a single-path check
      const dest = join(input.projectRoot, ".cursor", entry.path);
      const exists = await pathExists(dest);
      rows.push({
        root: entry.path,
        rel: "",
        status: exists ? "unchanged" : "missing-on-disk",
        detail: exists ? "" : "not found on disk",
      });
      continue;
    }

    for (const f of filesForEntry) {
      const dest =
        f.rel === ""
          ? join(input.projectRoot, ".cursor", f.root)
          : join(input.projectRoot, ".cursor", f.root, ...f.rel.split("/"));

      if (!(await pathExists(dest))) {
        rows.push({ root: f.root, rel: f.rel, status: "missing-on-disk", detail: "not found on disk" });
        continue;
      }

      let diskHash: string;
      try {
        diskHash = await digestFileContent(dest);
      } catch {
        rows.push({ root: f.root, rel: f.rel, status: "missing-on-disk", detail: "could not read file" });
        continue;
      }

      if (diskHash !== f.hash) {
        rows.push({ root: f.root, rel: f.rel, status: "modified-locally", detail: "disk differs from last managed snapshot" });
      } else {
        rows.push({ root: f.root, rel: f.rel, status: "unchanged", detail: "" });
      }
    }
  }

  return { rows, errorMessages: [] };
}
