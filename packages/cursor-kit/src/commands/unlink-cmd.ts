import type { Ui } from "../ui/create-ui.js";
import { runUnlinkEngine } from "../core/unlink-engine.js";

export type UnlinkCliOpts = {
  project: string;
  dryRun: boolean;
  forceWithoutManifest: boolean;
  forceRemoveModifiedCopy: boolean;
};

export async function runUnlinkCommand(ui: Ui, opts: UnlinkCliOpts): Promise<number> {
  ui.title("cursor-kit unlink");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Mode", value: opts.dryRun ? "dry-run" : "apply" },
  ]);
  ui.rule();

  const result = await runUnlinkEngine({
    projectRoot: opts.project,
    dryRun: opts.dryRun,
    forceWithoutManifest: opts.forceWithoutManifest,
    forceRemoveModifiedCopy: opts.forceRemoveModifiedCopy,
  });

  if (result.errorMessages.length > 0) {
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  ui.section("Results");
  ui.printTable(
    ["Item", "Status", "Detail"],
    result.rows.map((r) => [r.name, r.status, ui.dim(r.detail)]),
  );

  ui.rule();
  if (opts.dryRun) ui.warn("Dry run: no filesystem changes were made.");
  else ui.success(`Done. Manifest removed: ${String(result.updatedManifest)}.`);
  return 0;
}
