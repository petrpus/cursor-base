import { readManifest, writeManifest } from "./manifest.js";

export type EjectRow = {
  path: string;
  status: "ejected" | "already-ejected" | "not-found";
  detail: string;
};

export type EjectEngineResult = {
  rows: EjectRow[];
  errorMessages: string[];
};

export type EjectEngineInput = {
  projectRoot: string;
  /** Managed root paths to eject (e.g. "agents", "rules"). */
  paths: string[];
  dryRun: boolean;
};

export async function runEjectEngine(input: EjectEngineInput): Promise<EjectEngineResult> {
  const manifest = await readManifest(input.projectRoot);
  if (!manifest) {
    return {
      rows: [],
      errorMessages: ["No managed manifest found. Run `cursor-kit init` first."],
    };
  }

  const rows: EjectRow[] = [];

  const updatedManaged = manifest.managed.map((entry) => {
    if (!input.paths.includes(entry.path)) return entry;

    if (entry.ejected) {
      rows.push({ path: entry.path, status: "already-ejected", detail: "already locally owned" });
      return entry;
    }

    rows.push({ path: entry.path, status: "ejected", detail: "marked as locally owned; cursor-kit update will skip it" });
    return { ...entry, ejected: true as const };
  });

  for (const p of input.paths) {
    if (!manifest.managed.find((e) => e.path === p)) {
      rows.push({ path: p, status: "not-found", detail: "not in manifest" });
    }
  }

  const changed = rows.some((r) => r.status === "ejected");
  if (changed && !input.dryRun) {
    await writeManifest(input.projectRoot, { ...manifest, managed: updatedManaged });
  }

  return { rows, errorMessages: [] };
}
