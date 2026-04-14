import type { Ui } from "../ui/create-ui.js";
import { runDoctor } from "../core/doctor-engine.js";

export type DoctorCliOpts = {
  project: string;
  shared?: string;
  includeLocal: boolean;
};

export async function runDoctorCommand(ui: Ui, opts: DoctorCliOpts): Promise<number> {
  ui.title("cursor-kit doctor");
  ui.keyValue([{ key: "Project", value: opts.project }]);
  ui.rule();

  const result = await runDoctor({
    projectRoot: opts.project,
    sharedExplicit: opts.shared,
    includeLocal: opts.includeLocal,
  });

  ui.section("Checks");
  ui.printTable(
    ["Check", "Severity", "Detail"],
    result.rows.map((r) => [r.check, r.severity, ui.dim(r.detail)]),
  );

  ui.rule();
  if (result.exitCode === 0) ui.success("Doctor: OK (warnings may still be present).");
  else ui.error("Doctor: failed (see errors above).");
  return result.exitCode;
}
