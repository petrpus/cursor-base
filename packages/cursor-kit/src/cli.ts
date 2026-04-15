#!/usr/bin/env node
import { Command } from "commander";

import {
  HELP_AFTER_DOCTOR,
  HELP_AFTER_INIT_PROJECT,
  HELP_AFTER_LINK,
  HELP_AFTER_UPDATE,
  HELP_AFTER_UNLINK,
  HELP_EPILOG_ROOT,
} from "./cli-help-text.js";
import { runDoctorCommand } from "./commands/doctor-cmd.js";
import { runInitProjectCommand } from "./commands/init-project-cmd.js";
import { runLinkCommand } from "./commands/link-cmd.js";
import { runUnlinkCommand } from "./commands/unlink-cmd.js";
import { runUpdateCommand } from "./commands/update-cmd.js";
import type { LinkMode, SharedSourceKind } from "./constants.js";
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

type LinkOpts = NoColorFlag & {
  project: string;
  shared?: string;
  dryRun: boolean;
  force: boolean;
  includeLocal: boolean;
  mode?: LinkMode;
  symlink?: boolean;
  copy?: boolean;
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

type InitOpts = NoColorFlag & {
  project: string;
  dryRun: boolean;
  force: boolean;
};

type UpdateOpts = NoColorFlag & {
  project: string;
  shared?: string;
  dryRun: boolean;
  includeLocal: boolean;
  source: SourceKindOption;
  sourceRepo?: string;
};

function resolveLinkMode(raw: LinkOpts): LinkMode {
  if (raw.copy) return "copy";
  if (raw.symlink) return "symlink";
  if (raw.mode === "copy" || raw.mode === "symlink") return raw.mode;
  return "symlink";
}

function resolveSourceKind(raw: { source: SourceKindOption }): SharedSourceKind {
  return raw.source === "public" ? "public" : "local";
}

function resolveSharedSourceKind(raw: { source: SourceKindOption }): SharedSourceKind | "local-or-public" {
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
      "Internal CLI for the cursor-base shared Cursor toolkit: symlink shared .cursor/ " +
        "content into a project, validate layout (doctor), and scaffold local-only files (init-project).",
    )
    .version(getCliVersion(), "-V, --version", "print the CLI version")
    .helpOption("-h, --help", "show structured help (same for every subcommand)")
    .addHelpText("after", `\n${HELP_EPILOG_ROOT.trim()}\n`)
    .showHelpAfterError("(use --help or -h for usage)");

  program
    .command("link")
    .description(
      "Create project .cursor/ and materialize selected shared entries (symlink or copy).",
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
    .option("--mode <mode>", "materialization mode: symlink (default) or copy")
    .option("--symlink", "alias for --mode symlink", false)
    .option("--copy", "alias for --mode copy", false)
    .option("--source <kind>", "shared source: local (default), public, or auto", "auto")
    .option("--source-repo <owner/repo>", "public source repository (used with --source public)")
    .addHelpText("after", `\n${HELP_AFTER_LINK.trim()}\n`)
    .action(async (raw: LinkOpts) => {
      const ui = mkUi(raw);
      const resolvedMode = resolveLinkMode(raw);
      const resolvedSource = resolveSourceKind(raw);
      const resolvedSharedSource = resolveSharedSourceKind(raw);
      const code = await runLinkCommand(ui, {
        project: raw.project,
        shared: raw.shared,
        dryRun: raw.dryRun,
        force: raw.force,
        includeLocal: raw.includeLocal,
        mode: resolvedMode,
        source: resolvedSource,
        sharedSourceKind: resolvedSharedSource,
        sourceRepo: raw.sourceRepo,
      });
      process.exitCode = code;
    });

  program
    .command("update")
    .description("Refresh managed copied entries from source (separate from link).")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--dry-run", "print actions without changing files", false)
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
    .description("Validate shared source, symlinks, and recommended local files")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option(
      "--shared <path>",
      "shared .cursor directory or cursor-base repository root (overrides CURSOR_BASE_DIR)",
    )
    .option("--include-local", "expect `local/` symlink when validating", false)
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
    .command("init-project")
    .description("Scaffold conservative repo-local Cursor files (does not link shared content)")
    .option("--no-color", "disable colors and prefer ASCII icons", false)
    .option("--project <path>", "target project root", process.cwd())
    .option("--dry-run", "print actions without changing files", false)
    .option("--force", "overwrite existing scaffolded files", false)
    .addHelpText("after", `\n${HELP_AFTER_INIT_PROJECT.trim()}\n`)
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
