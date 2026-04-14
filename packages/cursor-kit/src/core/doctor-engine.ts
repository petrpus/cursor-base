import { join } from "node:path";

import { buildLinkNames } from "./link-targets.js";
import {
  isSymlink,
  pathExists,
  safeRealpath,
  symlinkPointsToRealpath,
} from "./fs-utils.js";
import { readManifest } from "./manifest.js";
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
        `.cursor is a symlink${rp ? ` → ${rp}` : ""}. Migrate to a real directory + symlinked children ` +
        `(see docs/dev/cursor-kit.md).`,
    });
    errors++;
  } else {
    rows.push({ check: "split layout", severity: "ok", detail: ".cursor is a real directory" });
  }

  const sharedRes = await resolveSharedCursorDir({
    explicit: input.sharedExplicit,
    projectDir: input.projectRoot,
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

  const manifest = await readManifest(input.projectRoot);
  const sharedRoot =
    sharedRes.ok && (await isSharedCursorRoot(sharedRes.sharedCursorDir))
      ? sharedRes.sharedCursorDir
      : undefined;

  if (!manifest) {
    rows.push({
      check: "managed manifest",
      severity: "warn",
      detail: "missing .cursor/.cursor-kit-managed.json (run cursor-kit link)",
    });
  } else {
    rows.push({
      check: "managed manifest",
      severity: "ok",
      detail: `managed entries: ${String(manifest.managed.length)}`,
    });
  }

  const { dirs, files } = buildLinkNames({ includeLocal: input.includeLocal });
  const expected = [...dirs, ...files];

  if (sharedRoot) {
    for (const name of expected) {
      const dest = join(cursorDir, name);
      const src = join(sharedRoot, name);
      if (!(await pathExists(src))) {
        rows.push({
          check: `shared:${name}`,
          severity: "warn",
          detail: "missing in shared tree (skipped by link)",
        });
        continue;
      }
      if (!(await pathExists(dest))) {
        rows.push({
          check: `link:${name}`,
          severity: "warn",
          detail: "missing in project .cursor/",
        });
        continue;
      }
      if (!(await isSymlink(dest))) {
        rows.push({
          check: `link:${name}`,
          severity: "error",
          detail: "exists but is not a symlink",
        });
        errors++;
        continue;
      }
      const ok = await symlinkPointsToRealpath(dest, src);
      if (!ok) {
        rows.push({
          check: `link:${name}`,
          severity: "error",
          detail: "symlink does not resolve to the expected shared path",
        });
        errors++;
      } else {
        rows.push({ check: `link:${name}`, severity: "ok", detail: "symlink OK" });
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
        detail: "missing (optional; add via init-project)",
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
    const manShared = manifest.sharedRoot;
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
