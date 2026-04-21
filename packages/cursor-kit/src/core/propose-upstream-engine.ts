import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { runDiffEngine } from "./diff-engine.js";

export type ProposeUpstreamEngineInput = {
  projectRoot: string;
  /** Short human description of the improvement. */
  description: string;
};

export type ProposeUpstreamEngineResult = {
  proposalPath: string | null;
  modifiedFiles: string[];
  errorMessages: string[];
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runProposeUpstreamEngine(
  input: ProposeUpstreamEngineInput,
): Promise<ProposeUpstreamEngineResult> {
  const diff = await runDiffEngine({ projectRoot: input.projectRoot });

  if (diff.errorMessages.length > 0) {
    return { proposalPath: null, modifiedFiles: [], errorMessages: diff.errorMessages };
  }

  const modified = diff.rows
    .filter((r) => r.status === "modified-locally")
    .map((r) => (r.rel ? `${r.root}/${r.rel}` : r.root));

  if (modified.length === 0) {
    return {
      proposalPath: null,
      modifiedFiles: [],
      errorMessages: ["No locally modified managed files found. Nothing to propose upstream."],
    };
  }

  const proposalsDir = join(input.projectRoot, "tmp", "upstream-proposals");
  await mkdir(proposalsDir, { recursive: true });

  const timestamp = isoDate();
  const slug = slugify(input.description) || "improvement";
  const filename = `${timestamp}-${slug}.md`;
  const proposalPath = join(proposalsDir, filename);

  const body = `# Upstream proposal: ${input.description}

**Date:** ${timestamp}
**Project:** ${input.projectRoot}

## Modified shared files

The following locally managed files differ from the last upstream snapshot and may be worth contributing back:

${modified.map((f) => `- \`.cursor/${f}\``).join("\n")}

## Suggested PR

**Title:** ${input.description}

**Body:**

\`\`\`
## Summary

- [Describe what changed and why it improves the shared kit]
- [List affected files]

## Test plan

- [ ] cursor-kit audit passes after change
- [ ] cursor-kit doctor passes in a consumer repo
- [ ] Rules/agents/skills references are valid

🤖 Proposed via cursor-kit propose-upstream
\`\`\`

## Next steps

1. Review the modified files listed above.
2. Open a pull request at https://github.com/petrpus/cursor-base with the changes.
3. Reference this proposal doc in the PR description.
`;

  await writeFile(proposalPath, body, "utf8");

  return { proposalPath, modifiedFiles: modified, errorMessages: [] };
}
