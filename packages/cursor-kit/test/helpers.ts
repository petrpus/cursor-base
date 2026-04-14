import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function rmrf(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function writeMinimalShared(sharedRoot: string): Promise<void> {
  const dirs = ["agents", "commands", "context", "docs", "hooks", "rules"];
  for (const d of dirs) {
    await mkdir(join(sharedRoot, d), { recursive: true });
    await writeFile(join(sharedRoot, d, ".keep"), "", "utf8");
  }
  await writeFile(join(sharedRoot, "README.md"), "# shared\n", "utf8");
  await writeFile(join(sharedRoot, "manifest.md"), "# manifest\n", "utf8");
}
