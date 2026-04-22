---
name: render-performance-check-skill
description: Check whether new React/Vue/Svelte components risk unnecessary re-renders due to unstable references or missing memoization.
skill_level: 2
invoke: inline
domain: frontend
default_model_tier: A
allowed_risk_tiers: [L1, L2, L3, L4]
output_type: binary
---

# Render Performance Check Skill

**Question:** Do new components or hooks create unstable object/array/function references that will cause unnecessary re-renders of their children?

**Trigger:** Any change that adds React components, hooks, context providers, or equivalent constructs in Vue/Svelte.

## Checks

1. Object and array literals are not created inline in JSX props or context values without `useMemo` — e.g. `<Component style={{ color: 'red' }}>` creates a new object on every render.
2. Function callbacks passed as props are stable via `useCallback` when the receiving component is memoized with `React.memo`.
3. Context providers wrap their `value` in `useMemo` when the context is consumed widely — bare `value={{ ... }}` objects defeat memoization.
4. Lists of components use stable `key` props — not array indexes when the list can be reordered.
5. Heavy computations inside render paths are `useMemo`-wrapped with correct deps.
6. New `useEffect` deps arrays do not include inline-created objects/functions that will be stale on every render.

## Output

- **PASS** — no unnecessary re-render risks detected.
- **FAIL(inline-object-prop)** — unstable object literal in prop or context value; inline-fix or escalate to `frontend-architecture-agent`.
- **FAIL(unstable-callback)** — function prop not memoized for a memoized child; escalate to `frontend-architecture-agent`.
- **FAIL(unstable-context)** — context provider value not memoized; escalate to `frontend-architecture-agent`.
- **FAIL(index-key)** — array index used as key in a reorderable list; inline-fix.
- **N/A** — change does not add reactive/rendered components.

## On FAIL

Fix `FAIL(inline-object-prop)` and `FAIL(index-key)` inline when obvious. Delegate complex cases to `frontend-architecture-agent` with the component code and FAIL code.

## Telemetry tags
- `skill_name:render-performance-check`
- `skill_level:2`
- `domain:frontend`
