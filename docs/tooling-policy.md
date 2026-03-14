# UI Tooling Policy

This document defines how UI-focused agents should gather evidence and decide whether to modify code, documentation, or both.

## Evidence priority

1. repository source code
2. shared components and wrappers
3. existing design-system documentation
4. repository AI context docs
5. dependency packages and usage patterns
6. external docs when needed

## Modification policy

- Update code when the implementation is drifting from an established repository convention.
- Update docs when a reusable rule or convention becomes explicit.
- Prefer documenting coherent existing patterns before proposing large changes.
- Record inconsistencies as debt when a safe normalization cannot be completed in the current task.
