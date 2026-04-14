import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { pathExists } from "../src/core/fs-utils.js";
import { runInitProjectEngine } from "../src/core/init-project-engine.js";
import { makeTempDir, rmrf } from "./helpers.js";

describe("runInitProjectEngine", () => {
  it("creates expected files", async () => {
    const project = await makeTempDir("ck-init-");
    try {
      const res = await runInitProjectEngine({ projectRoot: project, dryRun: false, force: false });
      expect(res.errorMessages).toEqual([]);
      expect(await pathExists(join(project, "AGENTS.md"))).toBe(true);
      expect(await pathExists(join(project, ".cursor", "mcp.json"))).toBe(true);
      const body = await readFile(join(project, "docs/ai", "INDEX.md"), "utf8");
      expect(body).toContain("docs/ai");
    } finally {
      await rmrf(project);
    }
  });

  it("dry-run does not create files", async () => {
    const project = await makeTempDir("ck-init-");
    try {
      await runInitProjectEngine({ projectRoot: project, dryRun: true, force: false });
      expect(await pathExists(join(project, "AGENTS.md"))).toBe(false);
    } finally {
      await rmrf(project);
    }
  });
});
