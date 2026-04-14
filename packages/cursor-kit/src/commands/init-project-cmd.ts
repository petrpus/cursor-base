import type { Ui } from "../ui/create-ui.js";
import { runInitProjectEngine } from "../core/init-project-engine.js";

export type InitProjectCliOpts = {
  project: string;
  dryRun: boolean;
  force: boolean;
};

export async function runInitProjectCommand(ui: Ui, opts: InitProjectCliOpts): Promise<number> {
  ui.title("cursor-kit init-project");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Mode", value: opts.dryRun ? "dry-run" : opts.force ? "apply (force)" : "apply" },
  ]);
  ui.rule();

  const result = await runInitProjectEngine({
    projectRoot: opts.project,
    dryRun: opts.dryRun,
    force: opts.force,
  });

  ui.section("Files");
  ui.printTable(
    ["Path", "Status", "Detail"],
    result.rows.map((r) => [r.path, r.status, ui.dim(r.detail)]),
  );

  for (const m of result.errorMessages) ui.error(m);

  ui.rule();
  if (opts.dryRun) ui.warn("Dry run: no filesystem changes were made.");
  else ui.success("Done.");
  return 0;
}
