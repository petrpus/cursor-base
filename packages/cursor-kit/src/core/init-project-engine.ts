import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  agentsMd,
  docsAiCloudAgentMd,
  docsAiIndexMd,
  environmentJson,
  hooksJson,
  mcpJson,
} from "../templates/bodies.js";
import { pathExists } from "./fs-utils.js";

export type InitRow = {
  path: string;
  status: "created" | "skipped_exists" | "would_create" | "would_skip_exists" | "overwritten";
  detail: string;
};

export type InitProjectInput = {
  projectRoot: string;
  dryRun: boolean;
  force: boolean;
};

export type InitProjectResult = {
  rows: InitRow[];
  errorMessages: string[];
};

type Target = { rel: string; body: string };

const targets: Target[] = [
  { rel: ".cursor/environment.json", body: environmentJson },
  { rel: ".cursor/mcp.json", body: mcpJson },
  { rel: ".cursor/hooks.json", body: hooksJson },
  { rel: "AGENTS.md", body: agentsMd },
  { rel: "docs/ai/INDEX.md", body: docsAiIndexMd },
  { rel: "docs/ai/CLOUD_AGENT.md", body: docsAiCloudAgentMd },
];

export async function runInitProjectEngine(input: InitProjectInput): Promise<InitProjectResult> {
  const rows: InitRow[] = [];
  const errorMessages: string[] = [];

  for (const t of targets) {
    const abs = join(input.projectRoot, t.rel);
    const dir = join(abs, "..");
    const exists = await pathExists(abs);

    if (input.dryRun) {
      if (exists && !input.force) {
        rows.push({ path: t.rel, status: "would_skip_exists", detail: "exists (use --force to overwrite)" });
      } else if (exists && input.force) {
        rows.push({ path: t.rel, status: "would_create", detail: "would overwrite (--force)" });
      } else {
        rows.push({ path: t.rel, status: "would_create", detail: "would create" });
      }
      continue;
    }

    if (exists && !input.force) {
      rows.push({ path: t.rel, status: "skipped_exists", detail: "already exists" });
      continue;
    }

    await mkdir(dir, { recursive: true });
    await writeFile(abs, t.body, "utf8");
    rows.push({
      path: t.rel,
      status: exists ? "overwritten" : "created",
      detail: exists ? "written (--force)" : "written",
    });
  }

  return { rows, errorMessages };
}
