import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  COPY_MODE_GITIGNORE_BEGIN,
  COPY_MODE_GITIGNORE_END,
  COPY_MODE_GITIGNORE_FILENAME,
  type LinkMode,
} from "../constants.js";
import { pathExists } from "./fs-utils.js";

function makeGitIgnoreBlock(entries: string[]): string {
  const rows = entries
    .map((entry) => `/${entry}`)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
  return `${COPY_MODE_GITIGNORE_BEGIN}\n${rows}\n${COPY_MODE_GITIGNORE_END}`;
}

export async function updateCopyModeGitIgnore(params: {
  projectRoot: string;
  mode: LinkMode;
  managedEntries: string[];
}): Promise<void> {
  const gitignorePath = join(params.projectRoot, ".cursor", COPY_MODE_GITIGNORE_FILENAME);
  const hasFile = await pathExists(gitignorePath);
  const current = hasFile ? await readFile(gitignorePath, "utf8") : "";
  const blockRegex = new RegExp(
    `${COPY_MODE_GITIGNORE_BEGIN}[\\s\\S]*?${COPY_MODE_GITIGNORE_END}\\n?`,
    "g",
  );
  const stripped = current.replace(blockRegex, "").trimEnd();

  if (params.mode !== "copy" || params.managedEntries.length === 0) {
    if (!hasFile && stripped.length === 0) return;
    const next = stripped.length > 0 ? `${stripped}\n` : "";
    await writeFile(gitignorePath, next, "utf8");
    return;
  }

  const block = makeGitIgnoreBlock(params.managedEntries);
  const prefix = stripped.length > 0 ? `${stripped}\n\n` : "";
  await writeFile(gitignorePath, `${prefix}${block}\n`, "utf8");
}
