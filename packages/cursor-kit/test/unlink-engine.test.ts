import { mkdir, readlink, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MANAGED_MANIFEST_RELATIVE } from "../src/constants.js";
import { pathExists } from "../src/core/fs-utils.js";
import { readManifest } from "../src/core/manifest.js";
import { runSyncEngine } from "../src/core/sync-engine.js";
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

  it("removes only managed copies", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    const local = join(project, ".cursor", "mcp.json");
    await writeFile(local, "{}", "utf8");

    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: false,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(local)).toBe(true);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
    expect(await readManifest(project)).toBeUndefined();
  });

  it("dry-run does not mutate filesystem", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: true,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(true);
    expect(await readManifest(project)).toBeTruthy();
  });

  it("skips symlink that does not match manifest shared root", async () => {
    await mkdir(join(project, ".cursor"), { recursive: true });
    const agents = join(project, ".cursor", "agents");
    await symlink("/tmp/other", agents);
    await writeFile(
      join(project, ".cursor", MANAGED_MANIFEST_RELATIVE),
      JSON.stringify(
        {
          version: 2,
          cliVersion: "test",
          mode: "symlink",
          source: { kind: "local", sharedRoot: shared },
          managed: [{ path: "agents", kind: "dir", mode: "symlink", sourcePath: "agents" }],
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );

    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: false,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(res.rows.some((r) => r.status === "skipped_wrong_target")).toBe(true);
    const target = await readlink(agents);
    expect(target).toBe("/tmp/other");
  });

  it("skips modified managed copies by default", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    await writeFile(join(project, ".cursor", "agents", ".keep"), "MODIFIED", "utf8");
    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: false,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(res.rows.some((r) => r.status === "skipped_modified_copy")).toBe(true);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(true);
  });

  it("removes modified managed copies with force variant", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    await writeFile(join(project, ".cursor", "agents", ".keep"), "MODIFIED", "utf8");
    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: false,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: true,
    });
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("retains manifest when modified copy entries are skipped", async () => {
    await runSyncEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      forceContent: false,
      sourceKind: "local",
    });
    await writeFile(join(project, ".cursor", "agents", ".keep"), "MODIFIED", "utf8");
    const res = await runUnlinkEngine({
      projectRoot: project,
      dryRun: false,
      forceWithoutManifest: false,
      forceRemoveModifiedCopy: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(res.rows.some((r) => r.status === "skipped_modified_copy")).toBe(true);
    const manifest = await readManifest(project);
    expect(manifest).toBeTruthy();
    expect(manifest?.managed.some((entry) => entry.path === "agents")).toBe(true);
  });
});
