import { join } from "node:path";
import { readFile, rm, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLinkCommand } from "../src/commands/link-cmd.js";
import { runUpdateCommand } from "../src/commands/update-cmd.js";
import { runLinkEngine } from "../src/core/link-engine.js";
import { readManifest, writeManifest } from "../src/core/manifest.js";
import { pathExists } from "../src/core/fs-utils.js";
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

  it("update refuses when no managed copy manifest exists", async () => {
    const code = await runUpdateCommand(createTestUi(), {
      project,
      shared,
      dryRun: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local",
    });
    expect(code).toBe(2);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("update refreshes only managed copied entries", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      mode: "copy",
      refreshManagedCopy: false,
      sourceKind: "local",
    });
    const manifest = await readManifest(project);
    expect(manifest).toBeTruthy();
    if (!manifest) throw new Error("missing manifest");
    await writeManifest(project, {
      ...manifest,
      managed: manifest.managed.filter((entry) => entry.path === "agents"),
    });
    await rm(join(project, ".cursor", "commands"), { recursive: true, force: true });
    await writeFile(join(shared, "agents", "updated.txt"), "updated", "utf8");

    const code = await runUpdateCommand(createTestUi(), {
      project,
      shared,
      dryRun: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local",
    });
    expect(code).toBe(0);
    expect(await pathExists(join(project, ".cursor", "agents", "updated.txt"))).toBe(true);
    expect(await pathExists(join(project, ".cursor", "commands"))).toBe(false);
  });

  it("link rejects symlink mode when auto source falls back to public", async () => {
    restorePath = await installFakeGitClone(shared);
    const code = await runLinkCommand(createTestUi(), {
      project,
      dryRun: false,
      force: false,
      includeLocal: false,
      mode: "symlink",
      source: "local",
      sharedSourceKind: "local-or-public",
    });
    expect(code).toBe(2);
    expect(await pathExists(join(project, ".cursor"))).toBe(false);
  });

  it("update supports auto fallback to public source", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      mode: "copy",
      refreshManagedCopy: false,
      sourceKind: "local",
    });
    await writeFile(join(shared, "agents", "public-refresh.txt"), "new", "utf8");
    restorePath = await installFakeGitClone(shared);

    const code = await runUpdateCommand(createTestUi(), {
      project,
      dryRun: false,
      includeLocal: false,
      source: "local",
      sharedSourceKind: "local-or-public",
    });
    expect(code).toBe(0);
    expect(await pathExists(join(project, ".cursor", "agents", "public-refresh.txt"))).toBe(true);

    const gitIgnore = await readFile(join(project, ".cursor", ".gitignore"), "utf8");
    expect(gitIgnore).toContain("# BEGIN cursor-kit managed copy");
  });
});
