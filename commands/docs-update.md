# /docs-update

Run a documentation pass: keep docs in sync, organized, interlinked, with code snippets and API coverage. Use a cheap/fast model when possible.

## Required workflow
1. use `docs-agent`
2. focus on: `docs/`, `.cursor/docs/`, READMEs, and any API or config surface that changed recently or is underdocumented
3. apply: standards, interlinking, copy-paste-safe snippets, full API docs where relevant

## Output
- List of files created or updated
- Short note on what was fixed or added
- Any recommended follow-ups (e.g. doc gaps, “document X when stable”)
