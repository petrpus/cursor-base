import type { Ui } from "../ui/create-ui.js";
import { runLinkEngine } from "../core/link-engine.js";
import { resolveSharedCursorDir } from "../core/resolve-shared.js";

export type LinkCliOpts = {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
};

export async function runLinkCommand(ui: Ui, opts: LinkCliOpts): Promise<number> {
  ui.title("cursor-kit link");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Shared", value: opts.shared ?? "(auto)" },
    { key: "Mode", value: opts.dryRun ? "dry-run" : opts.force ? "apply (force)" : "apply" },
  ]);
  ui.rule();

  const sharedRes = await resolveSharedCursorDir({
    explicit: opts.shared,
    projectDir: opts.project,
  });
  if (!sharedRes.ok) {
    ui.error(sharedRes.reason);
    return 2;
  }

  ui.info(`Resolved shared .cursor: ${sharedRes.sharedCursorDir} (${sharedRes.source})`);

  const result = await runLinkEngine({
    projectRoot: opts.project,
    sharedRoot: sharedRes.sharedCursorDir,
    includeLocal: opts.includeLocal,
    dryRun: opts.dryRun,
    force: opts.force,
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
      `Done. Managed entries: ${String(result.managed.length)}. Manifest written: ${String(result.wroteManifest)}.`,
    );
  }
  return 0;
}
