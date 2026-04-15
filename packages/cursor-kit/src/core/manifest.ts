import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { MANAGED_MANIFEST_RELATIVE } from "../constants.js";
import { DEFAULT_LINK_DIRS, type LinkMode, type SharedSourceKind } from "../constants.js";
import { pathExists } from "./fs-utils.js";

export const MANIFEST_VERSION = 3 as const;
export const MANIFEST_VERSION_2 = 2 as const;
const LEGACY_MANIFEST_VERSION = 1 as const;

export type ManagedFileRecord = {
  /** Managed top-level name under `.cursor/` (e.g. `agents`, `README.md`). */
  root: string;
  /** Path relative to `root` using `/`; empty string means the managed root is a single file. */
  rel: string;
  hash: string;
};

export type ManagedEntry = {
  path: string;
  kind: "dir" | "file";
  mode: LinkMode;
  sourcePath: string;
  /** v2 copy-mode tree digest only; unused for v3 (per-file hashes live in `files`). */
  digest?: string;
};

export type ManagedSource = {
  kind: SharedSourceKind;
  sharedRoot: string;
  repo?: string;
  ref?: string;
};

export type ManagedManifest = {
  version: typeof MANIFEST_VERSION | typeof MANIFEST_VERSION_2;
  cliVersion: string;
  mode: LinkMode;
  source: ManagedSource;
  /** Managed paths relative to project `.cursor/` (e.g. `agents`, `README.md`). */
  managed: ManagedEntry[];
  /** v3 only: per-file content hashes for merge-safe `update`. */
  files?: ManagedFileRecord[];
};

export function isManifestV3(m: ManagedManifest | undefined): m is ManagedManifest & { files: ManagedFileRecord[] } {
  return (
    m !== undefined &&
    m.version === MANIFEST_VERSION &&
    m.mode === "copy" &&
    Array.isArray(m.files)
  );
}

/** v2 copy-mode manifest (tree digest only): eligible for in-place upgrade to v3 per-file index. */
export function isLegacyCopyManifest(m: ManagedManifest | undefined): boolean {
  return m !== undefined && m.version === MANIFEST_VERSION_2 && m.mode === "copy";
}

export function manifestPath(projectRoot: string): string {
  return join(projectRoot, ".cursor", MANAGED_MANIFEST_RELATIVE);
}

function parseManagedEntries(o: Record<string, unknown>): ManagedEntry[] | undefined {
  if (!Array.isArray(o.managed)) return undefined;
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
  return managed;
}

function parseFiles(o: Record<string, unknown>): ManagedFileRecord[] | undefined {
  if (!("files" in o)) return undefined;
  if (!Array.isArray(o.files)) return undefined;
  const files: ManagedFileRecord[] = [];
  for (const candidate of o.files) {
    if (!candidate || typeof candidate !== "object") continue;
    const row = candidate as Record<string, unknown>;
    if (typeof row.root !== "string" || typeof row.rel !== "string" || typeof row.hash !== "string") continue;
    files.push({ root: row.root, rel: row.rel, hash: row.hash });
  }
  return files;
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
        mode: "symlink" as const,
        sourcePath: entry,
      }));
      return {
        version: MANIFEST_VERSION_2,
        cliVersion,
        mode: "symlink",
        source: { kind: "local", sharedRoot: o.sharedRoot },
        managed,
      };
    }

    if (o.version === MANIFEST_VERSION_2) {
      if (!o.source || typeof o.source !== "object") return undefined;
      const src = o.source as Record<string, unknown>;
      if ((src.kind !== "local" && src.kind !== "public") || typeof src.sharedRoot !== "string") return undefined;
      if (o.mode !== "symlink" && o.mode !== "copy") return undefined;
      const managed = parseManagedEntries(o);
      if (!managed) return undefined;
      return {
        version: MANIFEST_VERSION_2,
        cliVersion,
        mode: o.mode,
        source: {
          kind: src.kind,
          sharedRoot: src.sharedRoot,
          repo: typeof src.repo === "string" ? src.repo : undefined,
          ref: typeof src.ref === "string" ? src.ref : undefined,
        },
        managed,
        files: parseFiles(o),
      };
    }

    if (o.version !== MANIFEST_VERSION) return undefined;
    if (!o.source || typeof o.source !== "object") return undefined;
    const src = o.source as Record<string, unknown>;
    if ((src.kind !== "local" && src.kind !== "public") || typeof src.sharedRoot !== "string") return undefined;
    if (o.mode !== "copy") return undefined;
    const managed = parseManagedEntries(o);
    if (!managed) return undefined;
    const files = parseFiles(o);
    if (files === undefined) return undefined;

    return {
      version: MANIFEST_VERSION,
      cliVersion,
      mode: "copy",
      source: {
        kind: src.kind,
        sharedRoot: src.sharedRoot,
        repo: typeof src.repo === "string" ? src.repo : undefined,
        ref: typeof src.ref === "string" ? src.ref : undefined,
      },
      managed,
      files,
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
