import { join } from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runInitCommand } from "../src/commands/init-cmd.js";
import { runUpdateCommand } from "../src/commands/update-cmd.js";
import { pathExists } from "../src/core/fs-utils.js";
import { readManifest, writeManifest } from "../src/core/manifest.js";
import { runSyncEngine } from "../src/core/sync-engine.js";
import { createTestUi, installFakeGitClone, makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("command behavior", () => {
  let shared: string;
  let project: string;
  let restorePath: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    shared = await makeTempDir("ck-shared-cmd-");
    project = await makeTempDir("ck-proj-cmd-");
    await writeMinimalShared(shared);
  });

  afterEach(async () => {
    if (restorePath) await restorePath();
    await rmrf(shared);
    await rmrf(project);
  });

  it("update refuses when no managed manifest exists", async () => {
    const code = await runUpdateCommand(createTestUi(), {
      project,
      shared,
      dryRun: false,
      force: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local",
    });
    expect(code).toBe(2);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("update refreshes only managed roots present in manifest", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    const manifest = await readManifest(project);
    expect(manifest).toBeTruthy();
    if (!manifest) throw new Error("missing manifest");
    await writeManifest(project, {
      ...manifest,
      managed: manifest.managed.filter((entry) => entry.path === "agents"),
      files: (manifest.files ?? []).filter((f) => f.root === "agents"),
    });
    await rm(join(project, ".cursor", "commands"), { recursive: true, force: true });
    await writeFile(join(shared, "agents", "updated.txt"), "updated", "utf8");

    const code = await runUpdateCommand(createTestUi(), {
      project,
      shared,
      dryRun: false,
      force: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local",
    });
    expect(code).toBe(0);
    expect(await pathExists(join(project, ".cursor", "agents", "updated.txt"))).toBe(true);
    expect(await pathExists(join(project, ".cursor", "commands"))).toBe(false);
  });

  it("init succeeds when auto source falls back to public", async () => {
    restorePath = await installFakeGitClone(shared);
    const code = await runInitCommand(createTestUi(), {
      project,
      shared: undefined,
      dryRun: false,
      force: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local-or-public",
    });
    expect(code).toBe(0);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(true);
  });

  it("update pulls new files from an explicit shared checkout", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    await writeFile(join(shared, "agents", "public-refresh.txt"), "new", "utf8");

    const code = await runUpdateCommand(createTestUi(), {
      project,
      shared,
      dryRun: false,
      force: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local",
    });
    expect(code).toBe(0);
    expect(await pathExists(join(project, ".cursor", "agents", "public-refresh.txt"))).toBe(true);

    const gitIgnore = await readFile(join(project, ".cursor", ".gitignore"), "utf8");
    expect(gitIgnore).toContain("# BEGIN cursor-kit managed copy");
  });
});
