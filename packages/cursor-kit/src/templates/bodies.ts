/** Minimal valid JSON; add keys per Cursor docs and your team policy. */
export const environmentJson = "{}\n";

/** MCP server configuration (repo-local). */
export const mcpJson = '{ "mcpServers": {} }\n';

/** Cursor hooks configuration (repo-local). */
export const hooksJson = '{ "hooks": {} }\n';

export const agentsMd = `# AGENTS.md

This file is **project-local**. Describe how agents should work in this repository.

- Primary project context entry point for agents: \`docs/ai/README.md\` (create if missing).
- Shared Cursor rules live under \`.cursor/\` (often symlinked from cursor-base).

`;

export const docsAiIndexMd = `# docs/ai index

This project uses **docs/ai/** for adoption and navigation.

- Add \`README.md\` here as the primary agent entry point.
- Keep project-specific knowledge out of \`.cursor/\`.

`;

export const docsAiCloudAgentMd = `# Cloud agent notes

This is a placeholder for future cloud-agent adoption notes.

`;
