#!/usr/bin/env node
import { Command } from "commander";

import { runDoctorCommand } from "./commands/doctor-cmd.js";
import { runInitProjectCommand } from "./commands/init-project-cmd.js";
import { runLinkCommand } from "./commands/link-cmd.js";
import { runUnlinkCommand } from "./commands/unlink-cmd.js";
import { createUi, shouldUseColor, shouldUseUnicode } from "./ui/create-ui.js";
import { getCliVersion } from "./version.js";

type NoColorFlag = { noColor?: boolean };

function mkUi(flags: NoColorFlag) {
  const noColor = Boolean(flags.noColor);
  return createUi({
    useColor: shouldUseColor({
      noColor,
      forceColor: process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== "0",
      isTTY: process.stdout.isTTY,
    }),
    useUnicode: shouldUseUnicode(process.stdout.isTTY),
  });
}

type LinkOpts = NoColorFlag & {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
};

type UnlinkOpts = NoColorFlag & {
  project: string;
  dryRun: boolean;
  force: boolean;
};

type DoctorOpts = NoColorFlag & {
  project: string;
  shared?: string;
  includeLocal: boolean;
};

type InitOpts = NoColorFlag & {
  project: string;
  dryRun: boolean;
  force: boolean;
};

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("cursor-kit")
    .description("Link and manage shared Cursor toolkit (.cursor) in project repositories.")
    .version(getCliVersion())
    .showHelpAfterError("(use --help for usage)");

  program
    .command("link")
    .description(
      "Create project .cursor/ and symlink selected shared entries. Idempotent. Does not overwrite real files.",
    )
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "replace wrong managed symlinks only", false)
    .option("--include-local", "include symlink for shared `local/`", false)
    .addHelpText(
      "after",
      "\nExamples:\n  cursor-kit link --project ~/Code/my-app\n  cursor-kit link --shared ~/Code/cursor-base --dry-run\n",
    )
    .action(async (raw: LinkOpts) => {
      const ui = mkUi(raw);
      const code = await runLinkCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        dryRun: raw.dryRun,
        force: raw.force,
        includeLocal: raw.includeLocal,
      });
      process.exitCode = code;
    });

  program
    .command("unlink")
    .description("Remove only symlinks recorded in .cursor/.cursor-kit-managed.json")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option("--dry-run", "print actions without changing files", false)
    .option(
      "--force",
      "reserved; manifest-less unlink is not enabled for safety (see README)",
      false,
    )
    .action(async (raw: UnlinkOpts) => {
      const ui = mkUi(raw);
      const code = await runUnlinkCommand(ui, {
        project: raw.project,
        dryRun: raw.dryRun,
        force: raw.force,
      });
      process.exitCode = code;
    });

  program
    .command("doctor")
    .description("Validate shared source, symlinks, and recommended local files")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--include-local", "expect `local/` symlink when validating", false)
    .action(async (raw: DoctorOpts) => {
      const ui = mkUi(raw);
      const code = await runDoctorCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        includeLocal: raw.includeLocal,
      });
      process.exitCode = code;
    });

  program
    .command("init-project")
    .description("Scaffold conservative repo-local Cursor files (does not link shared content)")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "overwrite existing scaffolded files", false)
    .action(async (raw: InitOpts) => {
      const ui = mkUi(raw);
      const code = await runInitProjectCommand(ui, {
        project: raw.project,
        dryRun: raw.dryRun,
        force: raw.force,
      });
      process.exitCode = code;
    });

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
