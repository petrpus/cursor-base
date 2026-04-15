import type { Ui } from "../ui/create-ui.js";
import { runLinkEngine } from "../core/link-engine.js";
import { readManifest } from "../core/manifest.js";
import { resolveSharedCursorDir } from "../core/resolve-shared.js";
import type { SharedSourceKind } from "../constants.js";
import type { ResolveSharedInput } from "../core/resolve-shared.js";

export type UpdateCliOpts = {
  project: string;
  shared?: string;
  dryRun: boolean;
  includeLocal: boolean;
  source: SharedSourceKind;
  sharedSourceKind: ResolveSharedInput["sourceKind"];
  sourceRepo?: string;
};

export async function runUpdateCommand(ui: Ui, opts: UpdateCliOpts): Promise<number> {
  ui.title("cursor-kit update");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Source", value: opts.source },
    { key: "Shared", value: opts.shared ?? "(auto)" },
    { key: "Mode", value: opts.dryRun ? "dry-run" : "apply" },
  ]);
  ui.rule();

  const manifest = await readManifest(opts.project);
  if (!manifest) {
    ui.error("No managed manifest found. Run `cursor-kit link --mode copy` first.");
    return 2;
  }
  const managedCopyPaths = manifest.managed.filter((entry) => entry.mode === "copy").map((entry) => entry.path);
  if (managedCopyPaths.length === 0) {
    ui.error("No managed copy entries found. `cursor-kit update` only refreshes copy-mode entries.");
    return 2;
  }

  const sharedRes = await resolveSharedCursorDir({
    explicit: opts.shared,
    projectDir: opts.project,
    sourceKind: opts.sharedSourceKind,
    sourceRepo: opts.sourceRepo,
  });
  if (!sharedRes.ok) {
    ui.error(sharedRes.reason);
    return 2;
  }

  ui.info(`Resolved shared .cursor: ${sharedRes.sharedCursorDir} (${sharedRes.source})`);
  ui.info("Refreshing managed copied entries from source.");

  const result = await runLinkEngine({
    projectRoot: opts.project,
    sharedRoot: sharedRes.sharedCursorDir,
    includeLocal: opts.includeLocal || managedCopyPaths.includes("local"),
    dryRun: opts.dryRun,
    force: false,
    mode: "copy",
    refreshManagedCopy: true,
    managedOnlyPaths: managedCopyPaths,
    sourceKind: sharedRes.sourceKind,
    sourceRepo: sharedRes.sourceRepo,
    sourceRef: sharedRes.sourceRef,
  });

  ui.section("Plan / results");
  ui.printTable(
    ["Item", "Status", "Detail"],
    result.rows.map((r) => [r.name, r.status, ui.dim(r.detail)]),
  );

  if (result.errorMessages.length > 0) {
    ui.section("Issues");
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  ui.rule();
  if (opts.dryRun) {
    ui.warn("Dry run: no filesystem changes were made.");
  } else {
    ui.success(
      `Updated managed copy entries: ${String(result.managed.length)}. Manifest written: ${String(result.wroteManifest)}.`,
    );
  }
  return 0;
}
