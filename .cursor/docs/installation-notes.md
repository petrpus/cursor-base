# Installation Notes

0. **Split adoption (recommended for app repos):** if you consume this kit from a separate `cursor-base` checkout, prefer a **real** `project/.cursor/` directory with **symlinked subtrees** instead of symlinking the whole `.cursor` directory. Use the internal **`cursor-kit`** CLI — see [cursor-kit adoption](cursor-kit-adoption.md) and [docs/dev/cursor-kit.md](../../docs/dev/cursor-kit.md) in the `cursor-base` repository.
1. Replace the existing `.cursor/` directory with this one (whole-directory replacement remains supported for simple cases).
2. Merge `.cursor/local/gitignore.snippet` into the repository root `.gitignore` if needed.
3. Verify `hooks.json` points to existing local scripts.
   - Run a short Cursor session and confirm files are created in `tmp/chat-logs/`.
   - If logs look incomplete, inspect `tmp/chat-logs/_logger-errors.log` and the latest `tmp/chat-logs/machine/*.jsonl`.
4. If you rely on slash commands, keep `.cursor/commands/` as provided.
5. For best delegation results, start non-trivial tasks with language like:
   - "Plan this change and delegate to the relevant specialists first."
   - "Use the orchestrator and matching specialists before implementation."
