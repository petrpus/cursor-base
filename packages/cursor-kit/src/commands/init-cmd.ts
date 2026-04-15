import type { Ui } from "../ui/create-ui.js";
import { runInitProjectEngine } from "../core/init-project-engine.js";
import { runSyncEngine } from "../core/sync-engine.js";
import { resolveSharedCursorDir } from "../core/resolve-shared.js";
import type { SharedSourceKind } from "../constants.js";
import type { ResolveSharedInput } from "../core/resolve-shared.js";

export type InitCliOpts = {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
  source: SharedSourceKind;
  sharedSourceKind: ResolveSharedInput["sourceKind"];
  sourceRepo?: string;
};

export async function runInitCommand(ui: Ui, opts: InitCliOpts): Promise<number> {
  ui.title("cursor-kit init");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Source", value: opts.source },
    { key: "Shared", value: opts.shared ?? "(auto)" },
    { key: "Mode", value: opts.dryRun ? "dry-run" : opts.force ? "apply (--force)" : "apply" },
  ]);
  ui.rule();

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
  if (opts.source === "public" && sharedRes.sourceKind !== "public") {
    ui.error("Public source is required when --source public is set.");
    return 2;
  }

  ui.info(`Resolved shared .cursor: ${sharedRes.sharedCursorDir} (${sharedRes.source})`);

  const initProject = await runInitProjectEngine({
    projectRoot: opts.project,
    dryRun: opts.dryRun,
    force: opts.force,
  });
  ui.section("Local scaffold");
  for (const row of initProject.rows) {
    ui.line(`${row.path}: ${row.status} — ${row.detail}`);
  }
  if (initProject.errorMessages.length > 0) {
    for (const m of initProject.errorMessages) ui.error(m);
    return 2;
  }

  const sync = await runSyncEngine({
    projectRoot: opts.project,
    sharedRoot: sharedRes.sharedCursorDir,
    includeLocal: opts.includeLocal,
    dryRun: opts.dryRun,
    force: opts.force,
    forceContent: opts.force,
    sourceKind: sharedRes.sourceKind,
    sourceRepo: sharedRes.sourceRepo,
    sourceRef: sharedRes.sourceRef,
  });

  ui.section("Managed roots");
  ui.printTable(
    ["Item", "Status", "Detail"],
    sync.rootRows.map((r) => [r.name, r.status, ui.dim(r.detail)]),
  );

  ui.section("Files");
  if (sync.fileRows.length === 0) {
    ui.line(ui.dim("(none)"));
  } else {
    ui.printTable(
      ["Root", "Path", "Status", "Detail"],
      sync.fileRows.map((r) => [r.root, r.rel || "(root)", r.status, ui.dim(r.detail)]),
    );
  }

  if (sync.errorMessages.length > 0) {
    ui.section("Issues");
    for (const m of sync.errorMessages) ui.error(m);
    return 2;
  }

  ui.rule();
  if (opts.dryRun) {
    ui.warn("Dry run: no filesystem changes were made.");
  } else {
    ui.success(
      `Done. Manifest written: ${String(sync.wroteManifest)}. Root rows: ${String(sync.rootRows.length)}, file rows: ${String(sync.fileRows.length)}.`,
    );
  }
  return 0;
}
