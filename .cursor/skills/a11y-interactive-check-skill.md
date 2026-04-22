---
name: a11y-interactive-check-skill
description: Check whether new interactive UI elements meet baseline keyboard and ARIA accessibility requirements.
skill_level: 2
invoke: inline
domain: frontend
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: enumerated
---

# Accessibility Interactive Check Skill

**Question:** Do new interactive UI elements (buttons, modals, dropdowns, forms, navigation) meet baseline keyboard operability and ARIA requirements?

**Trigger:** Any change that adds or modifies interactive UI components — buttons, links, modals, dialogs, dropdowns, menus, forms, or focus-managed regions.

## Checks

1. Clickable elements are either `<button>` / `<a>` (native semantics) or have `role`, `tabindex="0"`, and keyboard event handlers — not just `onClick` on a `<div>`.
2. Modals and dialogs trap focus when open and restore focus to the trigger when closed.
3. Form fields have associated `<label>` elements or `aria-label` / `aria-labelledby` — no inputs with only placeholder text.
4. Error states are announced via `aria-describedby` or `role="alert"` — not only indicated by color.
5. Icon-only buttons have `aria-label` with a meaningful description.
6. Loading/empty/error states are communicated via text or `aria-live` — not only via spinner icons or color change.
7. New `tabindex` values are 0 or -1 only — positive tabindex values are not introduced.

## Output

- **PASS** — all interactive elements meet baseline keyboard and ARIA requirements.
- **FAIL(non-semantic-interactive)** — clickable div/span without keyboard or role; escalate to `ux-accessibility-agent`.
- **FAIL(missing-label)** — form field without label association; escalate to `ux-accessibility-agent`.
- **FAIL(untrap-focus)** — modal/dialog does not trap focus; escalate to `ux-accessibility-agent`.
- **FAIL(color-only-state)** — state communicated by color alone; escalate to `ux-accessibility-agent`.
- **FAIL(positive-tabindex)** — positive tabindex value introduced; inline-fix (replace with 0).
- **N/A** — change does not add or modify interactive UI elements.

## On FAIL

Delegate to `ux-accessibility-agent` with: the component code and the specific FAIL codes.

## Telemetry tags
- `skill_name:a11y-interactive-check`
- `skill_level:2`
- `domain:frontend`
