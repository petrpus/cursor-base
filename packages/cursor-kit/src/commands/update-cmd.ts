import type { Ui } from "../ui/create-ui.js";
import { readManifest } from "../core/manifest.js";
import { resolveSharedCursorDir } from "../core/resolve-shared.js";
import { runSyncEngine } from "../core/sync-engine.js";
import type { SharedSourceKind } from "../constants.js";
import type { ResolveSharedInput } from "../core/resolve-shared.js";

export type UpdateCliOpts = {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
  source: SharedSourceKind;
  sharedSourceKind: ResolveSharedInput["sourceKind"];
  sourceRepo?: string;
  branch?: string;
};

export async function runUpdateCommand(ui: Ui, opts: UpdateCliOpts): Promise<number> {
  ui.title("cursor-kit update");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Source", value: opts.source },
    { key: "Shared", value: opts.shared ?? "(auto)" },
    { key: "Mode", value: opts.dryRun ? "dry-run" : opts.force ? "apply (--force)" : "apply" },
  ]);
  ui.rule();

  const manifest = await readManifest(opts.project);
  if (!manifest) {
    ui.error("No managed manifest found. Run `cursor-kit init` first.");
    return 2;
  }
  if (manifest.mode === "symlink") {
    ui.error(
      "Symlink-based manifest is no longer supported. Run `cursor-kit init --force` once to migrate to hard-copied kit.",
    );
    return 2;
  }

  const sharedRes = await resolveSharedCursorDir({
    explicit: opts.shared,
    projectDir: opts.project,
    sourceKind: opts.sharedSourceKind,
    sourceRepo: opts.sourceRepo ?? manifest.source.repo,
    branch: opts.branch ?? manifest.source.ref,
  });
  if (!sharedRes.ok) {
    ui.error(sharedRes.reason);
    return 2;
  }

  ui.info(`Resolved shared .cursor: ${sharedRes.sharedCursorDir} (${sharedRes.source})`);
  ui.info(opts.force ? "Applying updates (--force overwrites local edits)." : "Applying updates (skipping locally modified files).");

  const includeLocal =
    opts.includeLocal || manifest.managed.some((entry) => entry.path === "local");

  const result = await runSyncEngine({
    projectRoot: opts.project,
    sharedRoot: sharedRes.sharedCursorDir,
    includeLocal,
    dryRun: opts.dryRun,
    force: opts.force,
    forceContent: opts.force,
    sourceKind: sharedRes.sourceKind,
    sourceRepo: sharedRes.sourceRepo,
    sourceRef: sharedRes.sourceRef,
    onlyManagedRoots: manifest.managed.map((entry) => entry.path),
  });

  ui.section("Managed roots");
  ui.printTable(
    ["Item", "Status", "Detail"],
    result.rootRows.map((r) => [r.name, r.status, ui.dim(r.detail)]),
  );

  ui.section("Files");
  if (result.fileRows.length === 0) {
    ui.line(ui.dim("(none)"));
  } else {
    ui.printTable(
      ["Root", "Path", "Status", "Detail"],
      result.fileRows.map((r) => [r.root, r.rel || "(root)", r.status, ui.dim(r.detail)]),
    );
  }

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
      `Updated. Manifest written: ${String(result.wroteManifest)}. File rows: ${String(result.fileRows.length)}.`,
    );
  }
  return 0;
}
