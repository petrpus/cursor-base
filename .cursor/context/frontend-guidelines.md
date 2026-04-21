# Frontend Guidelines

The frontend is treated as a product surface, not only as a view layer.

## Universal expectations

- Preserve design-system consistency; do not introduce ad-hoc styles or components when an established pattern exists.
- Keep route/page modules readable; favour composition over long monolithic files.
- Separate presentation from business-heavy orchestration when the distinction is meaningful.
- Design forms for validation clarity, keyboard accessibility, and error recovery.
- Cover all interaction states: loading, empty, success, validation-error, and failure.
- Maintain accessibility across viewport sizes; responsiveness is a functional requirement, not cosmetic polish.

## Specialist split

- **Design System Agent** — component APIs, tokens, variants, composability, naming
- **Frontend Architecture Agent** — route composition, form structure, page-level patterns, state boundaries
- **UX / Accessibility Agent** — keyboard paths, focus order, error discoverability, semantics, usability friction

## Project-specific stack

Framework, component library, styling system, and routing conventions are documented in `docs/ai/ui-stack.md`.
Run `/adopt-design-system` to generate it.
