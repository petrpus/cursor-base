#!/usr/bin/env node
import { Command } from "commander";

import {
  HELP_AFTER_DOCTOR,
  HELP_AFTER_INIT,
  HELP_AFTER_INIT_PROJECT,
  HELP_AFTER_UPDATE,
  HELP_AFTER_UNLINK,
  HELP_EPILOG_ROOT,
} from "./cli-help-text.js";
import { runDoctorCommand } from "./commands/doctor-cmd.js";
import { runInitCommand } from "./commands/init-cmd.js";
import { runInitProjectCommand } from "./commands/init-project-cmd.js";
import { runUnlinkCommand } from "./commands/unlink-cmd.js";
import { runUpdateCommand } from "./commands/update-cmd.js";
import type { SharedSourceKind } from "./constants.js";
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

type SourceKindOption = SharedSourceKind | "auto";

type InitKitOpts = NoColorFlag & {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
  source: SourceKindOption;
  sourceRepo?: string;
};

type UnlinkOpts = NoColorFlag & {
  project: string;
  dryRun: boolean;
  forceWithoutManifest: boolean;
  forceRemoveModifiedCopy: boolean;
};

type DoctorOpts = NoColorFlag & {
  project: string;
  shared?: string;
  includeLocal: boolean;
};

type InitProjectOpts = NoColorFlag & {
  project: string;
  dryRun: boolean;
  force: boolean;
};

type UpdateOpts = NoColorFlag & {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
  source: SourceKindOption;
  sourceRepo?: string;
};

function resolveSourceKind(raw: { source: SourceKindOption }): SharedSourceKind {
  return raw.source === "public" ? "public" : "local";
}

function resolveSharedSourceKind(raw: { source: SourceKindOption }): "local" | "public" | "local-or-public" {
  if (raw.source === "public") return "public";
  if (raw.source === "local") return "local";
  return "local-or-public";
}

async function main(): Promise<void> {
  const program = new Command();
  program.helpCommand(false);
  program
    .name("cursor-kit")
    .description(
      "Internal CLI for the cursor-base shared Cursor toolkit: hard-copy shared .cursor/ " +
        "content into a project, validate layout (doctor), and scaffold local-only files.",
    )
    .version(getCliVersion(), "-V, --version", "print the CLI version")
    .helpOption("-h, --help", "show structured help (same for every subcommand)")
    .addHelpText("after", `\n${HELP_EPILOG_ROOT.trim()}\n`)
    .showHelpAfterError("(use --help or -h for usage)");

  program
    .command("init")
    .description("Scaffold repo-local Cursor files and hard-copy the shared .cursor kit from cursor-base.")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "overwrite scaffold targets and replace managed roots / local edits where needed", false)
    .option("--include-local", "include shared `local/` when present", false)
    .option("--source <kind>", "shared source: local (default), public, or auto", "auto")
    .option("--source-repo <owner/repo>", "public source repository (used with --source public)")
    .addHelpText("after", `\n${HELP_AFTER_INIT.trim()}\n`)
    .action(async (raw: InitKitOpts) => {
      const ui = mkUi(raw);
      const resolvedSource = resolveSourceKind(raw);
      const resolvedSharedSource = resolveSharedSourceKind(raw);
      const code = await runInitCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        dryRun: raw.dryRun,
        force: raw.force,
        includeLocal: raw.includeLocal,
        source: resolvedSource,
        sharedSourceKind: resolvedSharedSource,
        sourceRepo: raw.sourceRepo,
      });
      process.exitCode = code;
    });

  program
    .command("update")
    .description("Reconcile hard-copied managed kit with shared source (skips local edits unless --force).")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--dry-run", "print actions without changing files", false)
    .option(
      "--force",
      "overwrite files that diverged from the last manifest (including local edits and orphan files)",
      false,
    )
    .option("--include-local", "include managed `local/` entry", false)
    .option("--source <kind>", "shared source: local (default), public, or auto", "auto")
    .option("--source-repo <owner/repo>", "public source repository (used with --source public)")
    .addHelpText("after", `\n${HELP_AFTER_UPDATE.trim()}\n`)
    .action(async (raw: UpdateOpts) => {
      const ui = mkUi(raw);
      const resolvedSource = resolveSourceKind(raw);
      const resolvedSharedSource = resolveSharedSourceKind(raw);
      const code = await runUpdateCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        dryRun: raw.dryRun,
        force: raw.force,
        includeLocal: raw.includeLocal,
        source: resolvedSource,
        sharedSourceKind: resolvedSharedSource,
        sourceRepo: raw.sourceRepo,
      });
      process.exitCode = code;
    });

  program
    .command("unlink")
    .description("Remove managed entries recorded in .cursor/.cursor-kit-managed.json")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option("--dry-run", "print actions without changing files", false)
    .option("--force-without-manifest", "attempt unlink when manifest is missing (still safety-restricted)", false)
    .option("--force-remove-modified-copy", "remove managed copy entries even when they were modified locally", false)
    .addHelpText("after", `\n${HELP_AFTER_UNLINK.trim()}\n`)
    .action(async (raw: UnlinkOpts) => {
      const ui = mkUi(raw);
      const code = await runUnlinkCommand(ui, {
        project: raw.project,
        dryRun: raw.dryRun,
        forceWithoutManifest: raw.forceWithoutManifest,
        forceRemoveModifiedCopy: raw.forceRemoveModifiedCopy,
      });
      process.exitCode = code;
    });

  program
    .command("doctor")
    .description("Validate shared source, managed kit layout, and recommended local files")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--include-local", "expect managed `local/` when validating", false)
    .addHelpText("after", `\n${HELP_AFTER_DOCTOR.trim()}\n`)
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
    .command("init-project", { hidden: true })
    .description("[deprecated] Scaffold repo-local Cursor files only; use `cursor-kit init`")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "overwrite existing scaffolded files", false)
    .addHelpText("after", `\n${HELP_AFTER_INIT_PROJECT.trim()}\n`)
    .action(async (raw: InitProjectOpts) => {
      console.warn("cursor-kit: `init-project` is deprecated; use `cursor-kit init` for scaffold + shared kit.");
      const ui = mkUi(raw);
      const code = await runInitProjectCommand(ui, {
        project: raw.project,
        dryRun: raw.dryRun,
        force: raw.force,
      });
      process.exitCode = code;
    });

  program
    .command("link", { hidden: true })
    .description("[deprecated] Use `cursor-kit init`")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "replace managed entries where needed", false)
    .option("--include-local", "include shared `local/` when present", false)
    .option("--source <kind>", "shared source: local (default), public, or auto", "auto")
    .option("--source-repo <owner/repo>", "public source repository (used with --source public)")
    .option("--mode <mode>", "ignored (copy-only toolkit)", "copy")
    .option("--symlink", "ignored", false)
    .option("--copy", "ignored", false)
    .action(async (raw: InitKitOpts & { mode?: string; symlink?: boolean; copy?: boolean }) => {
      console.warn("cursor-kit: `link` is deprecated; use `cursor-kit init` (hard-copy kit).");
      const ui = mkUi(raw);
      const resolvedSource = resolveSourceKind(raw);
      const resolvedSharedSource = resolveSharedSourceKind(raw);
      const code = await runInitCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        dryRun: raw.dryRun,
        force: raw.force,
        includeLocal: raw.includeLocal,
        source: resolvedSource,
        sharedSourceKind: resolvedSharedSource,
        sourceRepo: raw.sourceRepo,
      });
      process.exitCode = code;
    });

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
