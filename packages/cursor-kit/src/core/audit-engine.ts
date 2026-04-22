import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

import { pathExists } from "./fs-utils.js";

export type AuditFinding = {
  severity: "error" | "warn";
  location: string;
  reference: string;
  detail: string;
};

export type AuditEngineResult = {
  findings: AuditFinding[];
  agentsFound: number;
  skillsFound: number;
  commandsFound: number;
  referencesChecked: number;
  errorMessages: string[];
};

export type AuditEngineInput = {
  cursorDir: string;
};

async function listMdNames(dir: string): Promise<Set<string>> {
  const names = new Set<string>();
  if (!(await pathExists(dir))) return names;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".md")) {
        names.add(basename(e.name, ".md"));
      }
    }
  } catch {
    // ignore unreadable directories
  }
  return names;
}

async function listMdcAndMdFiles(dir: string): Promise<{ path: string; name: string }[]> {
  const results: { path: string; name: string }[] = [];
  if (!(await pathExists(dir))) return results;

  async function walk(current: string): Promise<void> {
    try {
      const entries = await readdir(current, { withFileTypes: true });
      for (const e of entries) {
        const full = join(current, e.name);
        if (e.isDirectory()) {
          await walk(full);
        } else if (e.isFile() && (e.name.endsWith(".mdc") || e.name.endsWith(".md"))) {
          results.push({ path: full, name: e.name });
        }
      }
    } catch {
      // ignore unreadable directories
    }
  }

  await walk(dir);
  return results;
}

/** Extract backtick-wrapped names that end with a known suffix. */
function extractReferences(content: string, suffix: string): string[] {
  const pattern = /`([a-z0-9-]+)`/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1].endsWith(suffix)) {
      found.push(match[1]);
    }
  }
  return [...new Set(found)];
}

export async function runAuditEngine(input: AuditEngineInput): Promise<AuditEngineResult> {
  const findings: AuditFinding[] = [];
  const errorMessages: string[] = [];

  const agentsDir = join(input.cursorDir, "agents");
  const skillsDir = join(input.cursorDir, "skills");
  const commandsDir = join(input.cursorDir, "commands");
  const rulesDir = join(input.cursorDir, "rules");

  const [agentNames, skillNames, commandNames] = await Promise.all([
    listMdNames(agentsDir),
    listMdNames(skillsDir),
    listMdNames(commandsDir),
  ]);

  // Scan rules for agent references
  const ruleFiles = await listMdcAndMdFiles(rulesDir);
  // Scan agents for skill references
  const agentFiles = await listMdcAndMdFiles(agentsDir);

  let refsChecked = 0;

  for (const file of ruleFiles) {
    let content: string;
    try {
      content = await readFile(file.path, "utf8");
    } catch {
      continue;
    }
    const refs = extractReferences(content, "-agent");
    for (const ref of refs) {
      refsChecked++;
      if (!agentNames.has(ref)) {
        findings.push({
          severity: "error",
          location: file.path.replace(input.cursorDir + "/", ""),
          reference: ref,
          detail: `agent not found in agents/ (missing ${ref}.md)`,
        });
      }
    }
    const skillRefs = extractReferences(content, "-skill");
    for (const ref of skillRefs) {
      refsChecked++;
      if (!skillNames.has(ref)) {
        findings.push({
          severity: "warn",
          location: file.path.replace(input.cursorDir + "/", ""),
          reference: ref,
          detail: `skill not found in skills/ (missing ${ref}.md)`,
        });
      }
    }
  }

  for (const file of agentFiles) {
    let content: string;
    try {
      content = await readFile(file.path, "utf8");
    } catch {
      continue;
    }
    const skillRefs = extractReferences(content, "-skill");
    for (const ref of skillRefs) {
      refsChecked++;
      if (!skillNames.has(ref)) {
        findings.push({
          severity: "error",
          location: file.path.replace(input.cursorDir + "/", ""),
          reference: ref,
          detail: `skill not found in skills/ (missing ${ref}.md)`,
        });
      }
    }
    const agentRefs = extractReferences(content, "-agent");
    for (const ref of agentRefs) {
      refsChecked++;
      if (!agentNames.has(ref)) {
        findings.push({
          severity: "warn",
          location: file.path.replace(input.cursorDir + "/", ""),
          reference: ref,
          detail: `agent not found in agents/ (missing ${ref}.md)`,
        });
      }
    }
  }

  return {
    findings,
    agentsFound: agentNames.size,
    skillsFound: skillNames.size,
    commandsFound: commandNames.size,
    referencesChecked: refsChecked,
    errorMessages,
  };
}
