import { lstat, mkdir, readFile, readlink, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLinkEngine } from "../src/core/link-engine.js";
import { pathExists } from "../src/core/fs-utils.js";
import { readManifest } from "../src/core/manifest.js";
import { makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

function linkInput(params: {
  projectRoot: string;
  sharedRoot: string;
  dryRun: boolean;
  force: boolean;
  mode: "symlink" | "copy";
  refreshManagedCopy?: boolean;
}) {
  return {
    projectRoot: params.projectRoot,
    sharedRoot: params.sharedRoot,
    includeLocal: false,
    dryRun: params.dryRun,
    force: params.force,
    mode: params.mode,
    refreshManagedCopy: params.refreshManagedCopy ?? false,
    sourceKind: "local" as const,
  };
}

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
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(true);
    const agents = join(project, ".cursor", "agents");
    const st = await lstat(agents);
    expect(st.isSymbolicLink()).toBe(true);
    const target = await readlink(agents);
    expect(target).toMatch(/agents$/);
    const m = await readManifest(project);
    expect(m?.managed.some((entry) => entry.path === "agents")).toBe(true);
    expect(m?.managed.some((entry) => entry.path === "rules")).toBe(true);
  });

  it("is idempotent", async () => {
    const a = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(a.errorMessages).toEqual([]);
    const b = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(b.errorMessages).toEqual([]);
    expect(b.rows.filter((r) => r.name === "agents" && r.status === "unchanged").length).toBe(1);
  });

  it("does not overwrite repo-specific real directories", async () => {
    const agentsPath = join(project, ".cursor", "agents");
    await mkdir(join(project, ".cursor"), { recursive: true });
    await mkdir(agentsPath, { recursive: true });
    await writeFile(join(agentsPath, "nope.md"), "x", "utf8");

    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rows.some((r) => r.status === "conflict_not_symlink")).toBe(true);
  });

  it("dry-run does not mutate filesystem", async () => {
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: true, force: false, mode: "symlink" }),
    );
    expect(res.errorMessages).toEqual([]);
    expect(res.wroteManifest).toBe(false);
    const m = await readManifest(project);
    expect(m).toBeUndefined();
    expect(await pathExists(join(project, ".cursor", "agents"))).toBe(false);
  });

  it("replaces wrong symlink with --force", async () => {
    await mkdir(join(project, ".cursor"), { recursive: true });
    await symlink("/tmp/definitely-not-cursor-kit-agents", join(project, ".cursor", "agents"));

    const bad = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(bad.errorMessages.length).toBeGreaterThan(0);

    const good = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: true, mode: "symlink" }),
    );
    expect(good.errorMessages).toEqual([]);
    const st = await lstat(join(project, ".cursor", "agents"));
    expect(st.isSymbolicLink()).toBe(true);
  });

  it("refuses when project .cursor is a symlink", async () => {
    await symlink(shared, join(project, ".cursor"));
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "symlink" }),
    );
    expect(res.errorMessages.length).toBeGreaterThan(0);
    expect(res.rows.length).toBe(0);
  });

  it("creates copied entries and gitignore block in copy mode", async () => {
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "copy" }),
    );
    expect(res.errorMessages).toEqual([]);
    const agents = join(project, ".cursor", "agents");
    const st = await lstat(agents);
    expect(st.isSymbolicLink()).toBe(false);
    expect(st.isDirectory()).toBe(true);
    const m = await readManifest(project);
    expect(m?.mode).toBe("copy");
    expect(m?.managed.some((entry) => entry.path === "agents" && entry.mode === "copy")).toBe(true);
    const gitignore = await readFile(join(project, ".cursor", ".gitignore"), "utf8");
    expect(gitignore).toContain("# BEGIN cursor-kit managed copy");
    expect(gitignore).toContain("/agents");
  });

  it("does not refresh managed copy entries during link", async () => {
    await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "copy" }),
    );
    await writeFile(join(shared, "agents", "from-shared.txt"), "new", "utf8");
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "copy" }),
    );
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents", "from-shared.txt"))).toBe(false);
  });

  it("refreshes managed copy entries when refreshManagedCopy is true", async () => {
    await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "copy" }),
    );
    await writeFile(join(shared, "agents", "from-shared.txt"), "new", "utf8");
    const res = await runLinkEngine(
      linkInput({ projectRoot: project, sharedRoot: shared, dryRun: false, force: false, mode: "copy", refreshManagedCopy: true }),
    );
    expect(res.errorMessages).toEqual([]);
    expect(await pathExists(join(project, ".cursor", "agents", "from-shared.txt"))).toBe(true);
  });
});
