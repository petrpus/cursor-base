import type { Ui } from "../ui/create-ui.js";
import { runProposeUpstreamEngine } from "../core/propose-upstream-engine.js";

export type ProposeUpstreamCliOpts = {
  project: string;
  description: string;
};

export async function runProposeUpstreamCommand(ui: Ui, opts: ProposeUpstreamCliOpts): Promise<number> {
  ui.title("cursor-kit propose-upstream");
  ui.keyValue([
    { key: "Project", value: opts.project },
    { key: "Description", value: opts.description },
  ]);
  ui.rule();

  const result = await runProposeUpstreamEngine({
    projectRoot: opts.project,
    description: opts.description,
  });

  if (result.errorMessages.length > 0) {
    for (const m of result.errorMessages) ui.error(m);
    return 2;
  }

  ui.section("Modified shared files");
  if (result.modifiedFiles.length === 0) {
    ui.line(ui.dim("(none)"));
  } else {
    for (const f of result.modifiedFiles) ui.line(`  .cursor/${f}`);
  }

  ui.rule();
  ui.success(`Proposal written to: ${result.proposalPath ?? "(none)"}`);
  ui.info("Review the proposal, then open a pull request to cursor-base with your changes.");
  return 0;
}
