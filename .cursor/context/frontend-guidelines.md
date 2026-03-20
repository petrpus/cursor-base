# Frontend Guidelines

The frontend is treated as a product surface, not only as a view layer.

## Expectations
- preserve design-system consistency
- keep route modules readable
- separate presentation from business-heavy orchestration when useful
- design forms for validation clarity, keyboard accessibility, and error recovery
- maintain responsive admin usability, not only mobile cosmetics
- cover loading, empty, success, validation-error, and failure states

## Frontend specialization split
- Design System Agent: component APIs, tokens, variants, composability, naming
- Frontend Architecture Agent: route composition, form structure, page-level patterns, state boundaries
- UX / Accessibility Agent: keyboard paths, focus order, error discoverability, semantics, usability friction
