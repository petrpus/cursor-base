import { symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runDoctor } from "../src/core/doctor-engine.js";
import { runLinkEngine } from "../src/core/link-engine.js";
import { makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("runDoctor", () => {
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
});
