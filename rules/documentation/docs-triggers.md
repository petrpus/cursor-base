# Documentation Triggers

Use `docs-agent` when a task involves:

- creating, updating, or reorganizing project documentation
- `docs/` or `docs/ai/` or `.cursor/docs/` or README files
- API documentation (public APIs, parameters, return types, examples)
- doc standards: interlinking, code snippets, table of contents, consistent style
- keeping docs in sync after code or config changes

The docs-agent is suited to a **cheap/fast model** and can be run frequently (e.g. after feature merges or on a schedule) to keep documentation comprehensive and up to date.

## Required outcome

- Docs reflect current behavior and APIs.
- New or changed surface area is documented; gaps are called out.
- Links and structure support discoverability; snippets are copy-paste safe.
