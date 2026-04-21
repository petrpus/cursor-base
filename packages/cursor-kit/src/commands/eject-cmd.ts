import type { Ui } from "../ui/create-ui.js";
import { runEjectEngine } from "../core/eject-engine.js";

export type EjectCliOpts = {
  project: string;
  dryRun: boolean;
  paths: string[];
};

export async function runEjectCommand(ui: Ui, opts: EjectCliOpts): Promise<number> {
  ui.title("cursor-kit eject");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Paths", value: opts.paths.join(", ") },
    { key: "Mode", value: opts.dryRun ? "dry-run" : "apply" },
  ]);
  ui.rule();

  if (opts.paths.length === 0) {
    ui.error("No paths provided. Pass one or more managed root names to eject (e.g. cursor-kit eject agents rules).");
    return 2;
  }

  const result = await runEjectEngine({
    projectRoot: opts.project,
    paths: opts.paths,
    dryRun: opts.dryRun,
  });

  if (result.errorMessages.length > 0) {
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  ui.section("Results");
  ui.printTable(
    ["Path", "Status", "Detail"],
    result.rows.map((r) => [r.path, r.status, ui.dim(r.detail)]),
  );

  ui.rule();
  if (opts.dryRun) {
    ui.warn("Dry run: no changes written.");
  } else {
    const ejectedCount = result.rows.filter((r) => r.status === "ejected").length;
    if (ejectedCount > 0) {
      ui.success(`${String(ejectedCount)} path(s) ejected. cursor-kit update will skip them.`);
      ui.info("To re-adopt an ejected path, run cursor-kit update --force.");
    } else {
      ui.info("No changes made.");
    }
  }
  return 0;
}
