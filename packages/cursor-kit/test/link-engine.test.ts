import { lstat, mkdir, readlink, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLinkEngine } from "../src/core/link-engine.js";
import { pathExists } from "../src/core/fs-utils.js";
import { readManifest } from "../src/core/manifest.js";
import { makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("runLinkEngine", () => {
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

  it("creates expected symlinks", async () => {
    const res = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(true);
    const agents = join(project, ".cursor", "agents");
    const st = await lstat(agents);
    expect(st.isSymbolicLink()).toBe(true);
    const target = await readlink(agents);
    expect(target).toMatch(/agents$/);
    const m = await readManifest(project);
    expect(m?.managed).toContain("agents");
    expect(m?.managed).toContain("rules");
  });

  it("is idempotent", async () => {
    const a = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(a.errorMessages).toEqual([]);
    const b = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(b.errorMessages).toEqual([]);
    expect(b.rows.filter((r) => r.name === "agents" && r.status === "unchanged").length).toBe(1);
  });

  it("does not overwrite repo-specific real directories", async () => {
    const agentsPath = join(project, ".cursor", "agents");
    await mkdir(join(project, ".cursor"), { recursive: true });
    await mkdir(agentsPath, { recursive: true });
    await writeFile(join(agentsPath, "nope.md"), "x", "utf8");

    const res = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rows.some((r) => r.status === "conflict_not_symlink")).toBe(true);
  });

  it("dry-run does not mutate filesystem", async () => {
    const res = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: true,
      force: false,
    });
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(false);
    const m = await readManifest(project);
    expect(m).toBeUndefined();
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("replaces wrong symlink with --force", async () => {
    await mkdir(join(project, ".cursor"), { recursive: true });
    await symlink("/tmp/definitely-not-cursor-kit-agents", join(project, ".cursor", "agents"));

    const bad = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(bad.errorMessages.length).toBeGreaterThan(0);

    const good = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: true,
    });
    expect(good.errorMessages).toEqual([]);
    const st = await lstat(join(project, ".cursor", "agents"));
    expect(st.isSymbolicLink()).toBe(true);
  });

  it("refuses when project .cursor is a symlink", async () => {
    await symlink(shared, join(project, ".cursor"));
    const res = await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
    });
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rows.length).toBe(0);
  });
});
