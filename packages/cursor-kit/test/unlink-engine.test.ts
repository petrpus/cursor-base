import { mkdir, readlink, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLinkEngine } from "../src/core/link-engine.js";
import { pathExists } from "../src/core/fs-utils.js";
import { readManifest } from "../src/core/manifest.js";
import { runUnlinkEngine } from "../src/core/unlink-engine.js";
import { makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("runUnlinkEngine", () => {
  let shared: string;
  let project: string;

  beforeEach(async () => {
    shared = await makeTempDir("ck-shared-");
    project = await makeTempDir("ck-proj-");
    await writeMinimalShared(shared);
  });

  afterEach(async () => {
    await rmrf(shared);
    await rmrf(project);
  });

  it("removes only managed symlinks", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    const local = join(project, ".cursor", "mcp.json");
    await writeFile(local, "{}", "utf8");

    const res = await runUnlinkEngine({ projectRoot: project, dryRun: false, forceWithoutManifest: false });
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(local)).toBe(true);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
    expect(await readManifest(project)).toBeUndefined();
  });

  it("dry-run does not mutate filesystem", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    const res = await runUnlinkEngine({ projectRoot: project, dryRun: true, forceWithoutManifest: false });
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(true);
    expect(await readManifest(project)).toBeTruthy();
  });

  it("skips symlink that does not match manifest shared root", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    const agents = join(project, ".cursor", "agents");
    await mkdir(join(project, ".cursor"), { recursive: true });
    // replace with wrong symlink manually (unlink validates against manifest.sharedRoot)
    const { rm } = await import("node:fs/promises");
    await rm(agents);
    await symlink("/tmp/other", agents);

    const res = await runUnlinkEngine({ projectRoot: project, dryRun: false, forceWithoutManifest: false });
    expect(res.errorMessages).toEqual([]);
    expect(res.rows.some((r) => r.status === "skipped_wrong_target")).toBe(true);
    const target = await readlink(agents);
    expect(target).toBe("/tmp/other");
  });
});
