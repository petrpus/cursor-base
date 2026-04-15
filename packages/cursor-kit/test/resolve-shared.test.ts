import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveSharedCursorDir } from "../src/core/resolve-shared.js";
import { installFakeGitClone, makeTempDir, rmrf, writeMinimalShared } from "./helpers.js";

describe("resolveSharedCursorDir", () => {
  let shared: string;
  let restorePath: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    shared = await makeTempDir("ck-shared-public-");
    await writeMinimalShared(shared);
  });

  afterEach(async () => {
    if (restorePath) await restorePath();
    await rmrf(shared);
  });

  it("resolves public source using main branch", async () => {
    restorePath = await installFakeGitClone(shared);
    const res = await resolveSharedCursorDir({
      projectDir: process.cwd(),
      sourceKind: "public",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.source).toBe("public");
      expect(res.sourceKind).toBe("public");
      expect(res.sourceRef).toBe("main");
    }
  });
});
