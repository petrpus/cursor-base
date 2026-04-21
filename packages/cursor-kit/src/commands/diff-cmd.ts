import type { Ui } from "../ui/create-ui.js";
import { runDiffEngine } from "../core/diff-engine.js";

export type DiffCliOpts = {
  project: string;
};

export async function runDiffCommand(ui: Ui, opts: DiffCliOpts): Promise<number> {
  ui.title("cursor-kit diff");
  ui.keyValue([{ key: "Project", value: opts.project }]);
  ui.rule();

  const result = await runDiffEngine({ projectRoot: opts.project });

  if (result.errorMessages.length > 0) {
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  if (result.rows.length === 0) {
    ui.info("No managed files found.");
    return 0;
  }

  const modified = result.rows.filter((r) => r.status === "modified-locally");
  const missing = result.rows.filter((r) => r.status === "missing-on-disk");
  const ejected = result.rows.filter((r) => r.status === "ejected");
  const unchanged = result.rows.filter((r) => r.status === "unchanged");

  ui.section("Modified locally");
  if (modified.length === 0) {
    ui.line(ui.dim("(none)"));
  } else {
    ui.printTable(
      ["Root", "Path", "Detail"],
      modified.map((r) => [r.root, r.rel || "(root)", ui.dim(r.detail)]),
    );
  }

  if (missing.length > 0) {
    ui.section("Missing on disk");
    ui.printTable(
      ["Root", "Path", "Detail"],
      missing.map((r) => [r.root, r.rel || "(root)", ui.dim(r.detail)]),
    );
  }

  if (ejected.length > 0) {
    ui.section("Ejected (locally owned)");
    ui.printTable(
      ["Root", "Path"],
      ejected.map((r) => [r.root, r.rel || "(root)"]),
    );
  }

  ui.rule();
  ui.info(
    `${String(modified.length)} modified, ${String(missing.length)} missing, ${String(ejected.length)} ejected, ${String(unchanged.length)} unchanged.`,
  );

  if (modified.length > 0) {
    ui.line("");
    ui.info("Run `cursor-kit propose-upstream --description \"<what you changed>\"` to draft an upstream PR.");
  }

  return modified.length > 0 || missing.length > 0 ? 1 : 0;
}
