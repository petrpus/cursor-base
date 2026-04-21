import { join } from "node:path";
import type { Ui } from "../ui/create-ui.js";
import { runAuditEngine } from "../core/audit-engine.js";

export type AuditCliOpts = {
  project: string;
};

export async function runAuditCommand(ui: Ui, opts: AuditCliOpts): Promise<number> {
  ui.title("cursor-kit audit");
  ui.keyValue([{ key: "Project", value: opts.project }]);
  ui.rule();

  const cursorDir = join(opts.project, ".cursor");
  const result = await runAuditEngine({ cursorDir });

  if (result.errorMessages.length > 0) {
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  ui.section("Index");
  ui.keyValue([
    { key: "Agents", value: String(result.agentsFound) },
    { key: "Skills", value: String(result.skillsFound) },
    { key: "Commands", value: String(result.commandsFound) },
    { key: "References checked", value: String(result.referencesChecked) },
  ]);

  const errors = result.findings.filter((f) => f.severity === "error");
  const warnings = result.findings.filter((f) => f.severity === "warn");

  if (result.findings.length === 0) {
    ui.section("Findings");
    ui.success("All references resolve correctly.");
  } else {
    if (errors.length > 0) {
      ui.section("Errors");
      ui.printTable(
        ["Location", "Reference", "Detail"],
        errors.map((f) => [f.location, f.reference, f.detail]),
      );
    }
    if (warnings.length > 0) {
      ui.section("Warnings");
      ui.printTable(
        ["Location", "Reference", "Detail"],
        warnings.map((f) => [f.location, f.reference, f.detail]),
      );
    }
  }

  ui.rule();
  if (errors.length > 0) {
    ui.error(`${String(errors.length)} broken reference(s) found.`);
    return 1;
  }
  if (warnings.length > 0) {
    ui.warn(`${String(warnings.length)} warning(s). No errors.`);
  } else {
    ui.success("Audit passed.");
  }
  return 0;
}
