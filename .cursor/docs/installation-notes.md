# Installation Notes

1. Replace the existing `.cursor/` directory with this one.
2. Merge `.cursor/local/gitignore.snippet` into the repository root `.gitignore` if needed.
3. Verify `hooks.json` points to existing local scripts.
   - Run a short Cursor session and confirm files are created in `tmp/chat-logs/`.
   - If logs look incomplete, inspect `tmp/chat-logs/_logger-errors.log` and the latest `tmp/chat-logs/machine/*.jsonl`.
4. If you rely on slash commands, keep `.cursor/commands/` as provided.
5. For best delegation results, start non-trivial tasks with language like:
   - "Plan this change and delegate to the relevant specialists first."
   - "Use the orchestrator and matching specialists before implementation."
