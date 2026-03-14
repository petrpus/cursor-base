# Frontend Triggers

When a task touches any of the following, the built-in Agent must consult frontend specialists before implementation:
- route modules
- pages
- forms
- tables
- dialogs
- shared UI components
- design tokens
- responsive layout
- admin screens

## Required routing
- page composition, forms, tables, admin UX -> `frontend-architecture-agent`
- shared UI component APIs, reusable primitives, styling conventions -> `design-system-agent`
- accessibility or responsive concerns -> `ux-accessibility-agent`
- design-system discovery or adoption -> `ui-stack-adapter` first, then `design-system-guardian`
- token cleanup or class normalization -> `design-token-auditor`
- deeper UI refactor execution -> `ui-refactor-specialist`
