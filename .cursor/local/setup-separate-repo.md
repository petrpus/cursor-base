# Prepared for Future Shared-Repo Extraction

Versioning is intentionally postponed, but this structure is ready for it.

## What is already future-proofed
- shared, portable knowledge lives under `.cursor/agents/`, `.cursor/rules/`, `.cursor/context/`
- local machine concerns live under `.cursor/local/`
- example hooks are separated from project-enforced logic

## Recommended future split
### Shared repository
- agents
- rules
- reusable context templates
- example hooks

### Project repository
- project-specific context
- project-specific adoption docs
- project-specific overrides

### Local ignored content
- `.cursor/local/bin/`
- `.cursor/local/logs/`
- `.cursor/local/tmp/`

## Migration-friendly rule
Keep reusable content path-stable from the beginning. That way a later extraction into a submodule, subtree, or sync script is mostly mechanical.
