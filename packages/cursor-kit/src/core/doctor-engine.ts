import { join } from "node:path";

import { buildLinkNames } from "./link-targets.js";
import { digestFileContent, digestPath } from "./copy-utils.js";
import { isSymlink, pathExists, safeRealpath, symlinkPointsToRealpath } from "./fs-utils.js";
import { MANIFEST_VERSION, readManifest } from "./manifest.js";
import { resolveSharedCursorDir } from "./resolve-shared.js";

export type DoctorSeverity = "ok" | "warn" | "error";

export type DoctorRow = {
  check: string;
  severity: DoctorSeverity;
  detail: string;
};

export type DoctorInput = {
  projectRoot: string;
  sharedExplicit?: string;
  includeLocal: boolean;
};

export type DoctorResult = {
  rows: DoctorRow[];
  exitCode: number;
};

async function isSharedCursorRoot(shared: string): Promise<boolean> {
  return (await pathExists(join(shared, "manifest.md"))) || (await pathExists(join(shared, "rules")));
}

function cursorKitManagedFilePath(projectRoot: string, root: string, rel: string): string {
  if (rel === "") {
    return join(projectRoot, ".cursor", root);
  }
  return join(projectRoot, ".cursor", root, ...rel.split("/"));
}

export async function runDoctor(input: DoctorInput): Promise<DoctorResult> {
  const rows: DoctorRow[] = [];
  let errors = 0;

  const cursorDir = join(input.projectRoot, ".cursor");

  if (!(await pathExists(cursorDir))) {
    rows.push({
      check: "project .cursor",
      severity: "error",
      detail: `missing: ${cursorDir}`,
    });
    errors++;
    return { rows, exitCode: 1 };
  }

  if (await isSymlink(cursorDir)) {
    const rp = await safeRealpath(cursorDir);
    rows.push({
      check: "split layout",
      severity: "error",
      detail:
        `.cursor is a symlink${rp ? ` → ${rp}` : ""}. Migrate to a real directory and run ` +
        "`cursor-kit init` (see docs/dev/cursor-kit.md).",
    });
    errors++;
  } else {
    rows.push({ check: "split layout", severity: "ok", detail: ".cursor is a real directory" });
  }

  const manifest = await readManifest(input.projectRoot);
  const sharedSourceKind = manifest?.source.kind ?? "local";
  const sharedSourceRepo = manifest?.source.repo;

  const sharedRes = await resolveSharedCursorDir({
    explicit: input.sharedExplicit,
    projectDir: input.projectRoot,
    sourceKind: sharedSourceKind,
    sourceRepo: sharedSourceRepo,
  });
  if (!sharedRes.ok) {
    rows.push({ check: "shared source", severity: "error", detail: sharedRes.reason });
    errors++;
  } else {
    const s = sharedRes.sharedCursorDir;
    if (!(await isSharedCursorRoot(s))) {
      rows.push({
        check: "shared source",
        severity: "error",
        detail: `does not look like a shared .cursor directory: ${s}`,
      });
      errors++;
    } else {
      rows.push({ check: "shared source", severity: "ok", detail: s });
    }
  }

  const sharedRoot =
    sharedRes.ok && (await isSharedCursorRoot(sharedRes.sharedCursorDir))
      ? sharedRes.sharedCursorDir
      : undefined;

  if (!manifest) {
    rows.push({
      check: "managed manifest",
      severity: "warn",
      detail: "missing .cursor/.cursor-kit-managed.json (run cursor-kit init)",
    });
  } else {
    rows.push({
      check: "managed manifest",
      severity: "ok",
      detail: `managed entries: ${String(manifest.managed.length)} (version=${String(manifest.version)}, mode=${manifest.mode})`,
    });
  }

  if (manifest?.mode === "symlink") {
    rows.push({
      check: "manifest",
      severity: "error",
      detail:
        "Symlink-based kit layout is no longer supported. Run `cursor-kit init --force` once to migrate to a hard-copied kit.",
    });
    errors++;
  }

  const { dirs, files } = buildLinkNames({ includeLocal: input.includeLocal });
  const expected = [...dirs, ...files];

  if (sharedRoot) {
    const legacySymlinkManifest = manifest?.mode === "symlink";
    for (const name of expected) {
      const dest = join(cursorDir, name);
      const src = join(sharedRoot, name);
      const managedEntry = manifest?.managed.find((entry) => entry.path === name);
      if (!(await pathExists(src))) {
        rows.push({
          check: `shared:${name}`,
          severity: "warn",
          detail: "missing in shared tree (skipped by init/update)",
        });
        continue;
      }
      if (!(await pathExists(dest))) {
        rows.push({
          check: `kit:${name}`,
          severity: "warn",
          detail: "missing in project .cursor/",
        });
        continue;
      }

      if (legacySymlinkManifest) {
        continue;
      }

      if (!managedEntry) {
        rows.push({
          check: `kit:${name}`,
          severity: "warn",
          detail: "present on disk but not listed in manifest",
        });
        continue;
      }

      if (managedEntry.mode === "copy") {
        if (await isSymlink(dest)) {
          rows.push({
            check: `kit:${name}`,
            severity: "error",
            detail: "expected copied entry but found symlink",
          });
          errors++;
          continue;
        }
        if (
          manifest &&
          manifest.version === MANIFEST_VERSION &&
          manifest.files &&
          manifest.files.length > 0
        ) {
          let mismatches = 0;
          for (const f of manifest.files.filter((row) => row.root === name)) {
            const p = cursorKitManagedFilePath(input.projectRoot, f.root, f.rel);
            if (!(await pathExists(p))) {
              mismatches++;
              continue;
            }
            try {
              const h = await digestFileContent(p);
              if (h !== f.hash) {
                mismatches++;
              }
            } catch {
              mismatches++;
            }
          }
          if (mismatches > 0) {
            rows.push({
              check: `kit:${name}`,
              severity: "warn",
              detail: `${String(mismatches)} managed file(s) differ from manifest (run cursor-kit update)`,
            });
          } else {
            rows.push({ check: `kit:${name}`, severity: "ok", detail: "per-file index matches disk" });
          }
          continue;
        }
        if (managedEntry.digest) {
          let currentDigest: string | undefined;
          try {
            currentDigest = await digestPath(dest);
          } catch {
            currentDigest = undefined;
          }
          if (!currentDigest || currentDigest !== managedEntry.digest) {
            rows.push({
              check: `kit:${name}`,
              severity: "warn",
              detail: "tree digest differs from last managed snapshot (run cursor-kit update)",
            });
          } else {
            rows.push({ check: `kit:${name}`, severity: "ok", detail: "copied content OK (legacy digest)" });
          }
        } else {
          rows.push({
            check: `kit:${name}`,
            severity: "ok",
            detail: "copied content present (legacy v2 copy; run update to build per-file index)",
          });
        }
        continue;
      }

      if (!(await isSymlink(dest))) {
        rows.push({
          check: `kit:${name}`,
          severity: "error",
          detail: "exists but is not a symlink (unexpected for legacy manifest)",
        });
        errors++;
        continue;
      }
      const ok = await symlinkPointsToRealpath(dest, src);
      if (!ok) {
        rows.push({
          check: `kit:${name}`,
          severity: "error",
          detail: "symlink does not resolve to the expected shared path",
        });
        errors++;
      } else {
        rows.push({ check: `kit:${name}`, severity: "ok", detail: "symlink OK (legacy)" });
      }
    }
  }

  if (manifest && manifest.mode !== "symlink") {
    const docsAiCore = ["README.md", "AGENT_ADOPTION.md", "source-of-truth.md"] as const;
    const docsAiDir = join(input.projectRoot, "docs", "ai");
    for (const f of docsAiCore) {
      const p = join(docsAiDir, f);
      if (!(await pathExists(p))) {
        rows.push({
          check: `docs/ai:${f}`,
          severity: "warn",
          detail: "missing after init; run /adopt-repo-docs in Cursor",
        });
      }
    }
  }

  const localFiles = ["environment.json", "mcp.json", "hooks.json"] as const;
  for (const f of localFiles) {
    const p = join(cursorDir, f);
    if (!(await pathExists(p))) {
      rows.push({
        check: `local:${f}`,
        severity: "warn",
        detail: "missing (optional; created by cursor-kit init)",
      });
    } else if (await isSymlink(p)) {
      rows.push({
        check: `local:${f}`,
        severity: "warn",
        detail: "is a symlink; repo-local config is usually a real file",
      });
    } else {
      rows.push({ check: `local:${f}`, severity: "ok", detail: "present" });
    }
  }

  if (manifest && sharedRoot) {
    const realShared = (await safeRealpath(sharedRoot)) ?? sharedRoot;
    const manShared = manifest.source.sharedRoot;
    const same = (await safeRealpath(manShared)) === (await safeRealpath(realShared));
    if (!same) {
      rows.push({
        check: "manifest sharedRoot",
        severity: "warn",
        detail: `manifest sharedRoot differs from resolved --shared/auto shared (${manShared} vs ${realShared})`,
      });
    }
  }

  return { rows, exitCode: errors > 0 ? 1 : 0 };
}
