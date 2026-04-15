import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { MANAGED_MANIFEST_RELATIVE } from "../constants.js";
import { DEFAULT_LINK_DIRS, type LinkMode, type SharedSourceKind } from "../constants.js";
import { pathExists } from "./fs-utils.js";

export const MANIFEST_VERSION = 2 as const;
const LEGACY_MANIFEST_VERSION = 1 as const;

export type ManagedEntry = {
  path: string;
  kind: "dir" | "file";
  mode: LinkMode;
  sourcePath: string;
  digest?: string;
};

export type ManagedSource = {
  kind: SharedSourceKind;
  sharedRoot: string;
  repo?: string;
  ref?: string;
};

export type ManagedManifest = {
  version: typeof MANIFEST_VERSION;
  cliVersion: string;
  /** How managed entries are materialized in project .cursor. */
  mode: LinkMode;
  /** Source metadata used by doctor/unlink/update. */
  source: ManagedSource;
  /** Managed paths relative to project `.cursor/` (e.g. `agents`, `README.md`). */
  managed: ManagedEntry[];
};

export function manifestPath(projectRoot: string): string {
  return join(projectRoot, ".cursor", MANAGED_MANIFEST_RELATIVE);
}

export async function readManifest(projectRoot: string): Promise<ManagedManifest | undefined> {
  const p = manifestPath(projectRoot);
  if (!(await pathExists(p))) return undefined;
  try {
    const raw = await readFile(p, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return undefined;
    const o = parsed as Record<string, unknown>;
    const cliVersion = typeof o.cliVersion === "string" ? o.cliVersion : "unknown";
    if (o.version === LEGACY_MANIFEST_VERSION) {
      if (typeof o.sharedRoot !== "string" || !Array.isArray(o.managed)) return undefined;
      const managedStrings = o.managed.filter((x): x is string => typeof x === "string");
      const managed: ManagedEntry[] = managedStrings.map((entry) => ({
        path: entry,
        kind: DEFAULT_LINK_DIRS.includes(entry as (typeof DEFAULT_LINK_DIRS)[number]) ? "dir" : "file",
        mode: "symlink",
        sourcePath: entry,
      }));
      return {
        version: MANIFEST_VERSION,
        cliVersion,
        mode: "symlink",
        source: { kind: "local", sharedRoot: o.sharedRoot },
        managed,
      };
    }
    if (o.version !== MANIFEST_VERSION) return undefined;
    if (!o.source || typeof o.source !== "object" || !Array.isArray(o.managed)) return undefined;

    const src = o.source as Record<string, unknown>;
    if ((src.kind !== "local" && src.kind !== "public") || typeof src.sharedRoot !== "string") return undefined;
    if (o.mode !== "symlink" && o.mode !== "copy") return undefined;

    const managed: ManagedEntry[] = [];
    for (const candidate of o.managed) {
      if (!candidate || typeof candidate !== "object") continue;
      const entry = candidate as Record<string, unknown>;
      if (typeof entry.path !== "string") continue;
      if (entry.kind !== "dir" && entry.kind !== "file") continue;
      if (entry.mode !== "symlink" && entry.mode !== "copy") continue;
      if (typeof entry.sourcePath !== "string") continue;
      managed.push({
        path: entry.path,
        kind: entry.kind,
        mode: entry.mode,
        sourcePath: entry.sourcePath,
        digest: typeof entry.digest === "string" ? entry.digest : undefined,
      });
    }

    return {
      version: MANIFEST_VERSION,
      cliVersion,
      mode: o.mode,
      source: {
        kind: src.kind,
        sharedRoot: src.sharedRoot,
        repo: typeof src.repo === "string" ? src.repo : undefined,
        ref: typeof src.ref === "string" ? src.ref : undefined,
      },
      managed,
    };
  } catch {
    return undefined;
  }
}

export async function writeManifest(projectRoot: string, m: ManagedManifest): Promise<void> {
  const p = manifestPath(projectRoot);
  const body = `${JSON.stringify(m, null, 2)}\n`;
  await writeFile(p, body, "utf8");
}
