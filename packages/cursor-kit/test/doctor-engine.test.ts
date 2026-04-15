import { symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runDoctor } from "../src/core/doctor-engine.js";
import { runLinkEngine } from "../src/core/link-engine.js";
import { installFakeGitClone, makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("runDoctor", () => {
  let shared: string;
  let project: string;
  let restorePath: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    shared = await makeTempDir("ck-shared-");
    project = await makeTempDir("ck-proj-");
    await writeMinimalShared(shared);
  });

  afterEach(async () => {
    if (restorePath) await restorePath();
    await rmrf(shared);
    await rmrf(project);
  });

  it("reports invalid setup when .cursor missing", async () => {
    const res = await runDoctor({
      projectRoot: project,
      sharedExplicit: shared,
      includeLocal: false,
    });
    expect(res.exitCode).toBe(1);
    expect(res.rows.some((r) => r.check === "project .cursor" && r.severity === "error")).toBe(true);
  });

  it("reports valid setup after link", async () => {
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      mode: "symlink",
      refreshManagedCopy: false,
      sourceKind: "local",
    });
    await writeFile(join(project, ".cursor", "environment.json"), "{}", "utf8");
    await writeFile(join(project, ".cursor", "mcp.json"), "{}", "utf8");
    await writeFile(join(project, ".cursor", "hooks.json"), "{}", "utf8");

    const res = await runDoctor({
      projectRoot: project,
      sharedExplicit: shared,
      includeLocal: false,
    });
    expect(res.exitCode).toBe(0);
    expect(res.rows.some((r) => r.severity === "error")).toBe(false);
    expect(res.rows.some((r) => r.check === "docs/ai:README.md" && r.severity === "warn")).toBe(true);
    expect(res.rows.some((r) => r.check === "docs/ai:AGENT_ADOPTION.md" && r.severity === "warn")).toBe(
      true,
    );
    expect(
      res.rows.some((r) => r.check === "docs/ai:source-of-truth.md" && r.severity === "warn"),
    ).toBe(true);
  });

  it("flags whole-directory .cursor symlink as error", async () => {
    await symlink(shared, join(project, ".cursor"));
    const res = await runDoctor({
      projectRoot: project,
      sharedExplicit: shared,
      includeLocal: false,
    });
    expect(res.exitCode).toBe(1);
    expect(res.rows.some((r) => r.check === "split layout")).toBe(true);
  });

  it("warns when copied content drifts from managed digest", async () => {
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
    await writeFile(join(project, ".cursor", "agents", "local-change.txt"), "x", "utf8");

    const res = await runDoctor({
      projectRoot: project,
      sharedExplicit: shared,
      includeLocal: false,
    });
    expect(res.exitCode).toBe(0);
    expect(
      res.rows.some(
        (r) =>
          r.check === "link:agents" &&
          r.severity === "warn" &&
          r.detail.includes("copy digest differs"),
      ),
    ).toBe(true);
  });

  it("supports doctor for projects linked from public source", async () => {
    restorePath = await installFakeGitClone(shared);
    await runLinkEngine({
      projectRoot: project,
      sharedRoot: shared,
      includeLocal: false,
      dryRun: false,
      force: false,
      mode: "copy",
      refreshManagedCopy: false,
      sourceKind: "public",
      sourceRepo: "cursor-sh/cursor-base",
      sourceRef: "main",
    });

    const res = await runDoctor({
      projectRoot: project,
      includeLocal: false,
    });
    expect(res.exitCode).toBe(0);
    expect(res.rows.some((r) => r.check === "shared source" && r.severity === "ok")).toBe(true);
  });
});
