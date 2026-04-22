---
name: design-token-usage-check-skill
description: Check whether new UI styles use design tokens rather than hardcoded color, spacing, or typography values.
skill_level: 2
invoke: inline
domain: frontend
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Design Token Usage Check Skill

**Question:** Do new UI styles use the project's design token system (CSS variables, Tailwind config values, theme tokens) — or do they hardcode colors, spacing, font sizes, or border radii?

**Trigger:** Any change that adds or modifies CSS, Tailwind classes, styled-components, or inline styles in UI components.

## Checks

1. Color values are not hardcoded hex/rgb literals (e.g. `#FF5733`, `rgb(255,87,51)`) — use project color tokens or Tailwind color classes.
2. Spacing values are not hardcoded pixel amounts outside the design scale — use Tailwind spacing scale, CSS custom properties, or theme spacing tokens.
3. Font sizes are from the project type scale — not arbitrary `12px`, `15px`, `22px` values.
4. Border radii are from the project radius tokens — not arbitrary pixel values.
5. If a new value truly has no token equivalent, a token is proposed (as a comment or TODO) rather than silently hardcoded.
6. Shadow, opacity, and z-index values follow the project scale when one exists.

## Output

- **PASS** — all new styles use the project's token system.
- **FAIL(hardcoded-color)** — literal color value in styles; escalate to `design-system-agent`.
- **FAIL(hardcoded-spacing)** — arbitrary spacing value outside design scale; escalate to `design-system-agent`.
- **FAIL(hardcoded-typography)** — arbitrary font size or weight; escalate to `design-system-agent`.
- **WARN(missing-token)** — value has no equivalent token yet; note for `design-system-agent` to create one.
- **N/A** — change does not add or modify UI styles, or this project does not use a token system.

## On FAIL

Delegate to `design-system-agent` with: the specific hardcoded values and the component file.

## Telemetry tags
- `skill_name:design-token-usage-check`
- `skill_level:2`
- `domain:frontend`
