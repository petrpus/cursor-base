import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { MANAGED_MANIFEST_RELATIVE } from "../constants.js";
import { pathExists } from "./fs-utils.js";

export const MANIFEST_VERSION = 1 as const;

export type ManagedManifest = {
  version: typeof MANIFEST_VERSION;
  cliVersion: string;
  /** Realpath of shared `.cursor` root at link time. */
  sharedRoot: string;
  /** Paths relative to project `.cursor/` (e.g. `agents`, `README.md`). */
  managed: string[];
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
    if (o.version !== MANIFEST_VERSION) return undefined;
    if (typeof o.sharedRoot !== "string" || !Array.isArray(o.managed)) return undefined;
    const managed = o.managed.filter((x): x is string => typeof x === "string");
    const cliVersion = typeof o.cliVersion === "string" ? o.cliVersion : "unknown";
    return { version: MANIFEST_VERSION, cliVersion, sharedRoot: o.sharedRoot, managed };
  } catch {
    return undefined;
  }
}

export async function writeManifest(projectRoot: string, m: ManagedManifest): Promise<void> {
  const p = manifestPath(projectRoot);
  const body = `${JSON.stringify(m, null, 2)}\n`;
  await writeFile(p, body, "utf8");
}
