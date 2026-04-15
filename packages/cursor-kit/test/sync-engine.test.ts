import { lstat, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { pathExists } from "../src/core/fs-utils.js";
import { readManifest } from "../src/core/manifest.js";
import { runSyncEngine } from "../src/core/sync-engine.js";
import { makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

function syncInput(params: {
  projectRoot: string;
  sharedRoot: string;
  dryRun: boolean;
  force: boolean;
  forceContent?: boolean;
}) {
  return {
    projectRoot: params.projectRoot,
    sharedRoot: params.sharedRoot,
    includeLocal: false,
    dryRun: params.dryRun,
    force: params.force,
    forceContent: params.forceContent ?? params.force,
    sourceKind: "local" as const,
  };
}

describe("runSyncEngine", () => {
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

  it("creates copied entries and manifest v3", async () => {
    const res = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(true);
    const agents = join(project, ".cursor", "agents");
    const st = await lstat(agents);
    expect(st.isSymbolicLink()).toBe(false);
    expect(st.isDirectory()).toBe(true);
    const m = await readManifest(project);
    expect(m?.mode).toBe("copy");
    expect(m?.version).toBe(3);
    expect(m?.files?.length).toBeGreaterThan(0);
    expect(m?.managed.some((entry) => entry.path === "agents" && entry.mode === "copy")).toBe(true);
    const gitignore = await readFile(join(project, ".cursor", ".gitignore"), "utf8");
    expect(gitignore).toContain("# BEGIN cursor-kit managed copy");
    expect(gitignore).toContain("/agents");
  });

  it("is idempotent for roots and files", async () => {
    const a = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(a.errorMessages).toEqual([]);
    const b = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(b.errorMessages).toEqual([]);
    expect(b.rootRows.filter((r) => r.name === "agents" && r.status === "unchanged").length).toBe(1);
  });

  it("does not overwrite repo-specific real directories without --force", async () => {
    const agentsPath = join(project, ".cursor", "agents");
    await mkdir(join(project, ".cursor"), { recursive: true });
    await mkdir(agentsPath, { recursive: true });
    await writeFile(join(agentsPath, "nope.md"), "x", "utf8");

    const res = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rootRows.some((r) => r.status === "conflict_not_symlink")).toBe(true);
  });

  it("dry-run does not mutate filesystem", async () => {
    const res = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: true, force: false }));
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(false);
    const m = await readManifest(project);
    expect(m).toBeUndefined();
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("replaces wrong symlink with --force", async () => {
    await mkdir(join(project, ".cursor"), { recursive: true });
    await symlink("/tmp/definitely-not-cursor-kit-agents", join(project, ".cursor", "agents"));

    const bad = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(bad.errorMessages.length).toBeGreaterThan(0);

    const good = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: true }));
    expect(good.errorMessages).toEqual([]);
    const st = await lstat(join(project, ".cursor", "agents"));
    expect(st.isSymbolicLink()).toBe(false);
    expect(st.isDirectory()).toBe(true);
  });

  it("refuses when project .cursor is a symlink", async () => {
    await symlink(shared, join(project, ".cursor"));
    const res = await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rootRows.length).toBe(0);
  });

  it("pulls new files from shared on subsequent sync", async () => {
    await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    await writeFile(join(shared, "agents", "from-shared.txt"), "new", "utf8");
    const res = await runSyncEngine(
      syncInput({
        projectRoot: project,
        sharedRoot: shared,
        dryRun: false,
        force: false,
        forceContent: false,
      }),
    );
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents", "from-shared.txt"))).toBe(true);
  });

  it("skips user-edited file on update unless forceContent", async () => {
    await runSyncEngine(syncInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false }));
    const userFile = join(project, ".cursor", "agents", ".keep");
    await writeFile(userFile, "USER", "utf8");
    await writeFile(join(shared, "agents", ".keep"), "SHARED", "utf8");

    const skip = await runSyncEngine(
      syncInput({
        projectRoot: project,
        sharedRoot: shared,
        dryRun: false,
        force: false,
        forceContent: false,
      }),
    );
    expect(skip.errorMessages).toEqual([]);
    expect((await readFile(userFile, "utf8")).trim()).toBe("USER");
    expect(skip.fileRows.some((r) => r.status === "skipped_user_edit")).toBe(true);

    const forced = await runSyncEngine(
      syncInput({
        projectRoot: project,
        sharedRoot: shared,
        dryRun: false,
        force: false,
        forceContent: true,
      }),
    );
    expect(forced.errorMessages).toEqual([]);
    expect((await readFile(userFile, "utf8")).trim()).toBe("SHARED");
  });
});
