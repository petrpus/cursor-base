#!/usr/bin/env bash
set -euo pipefail

# Example wrapper only. Copy and adapt locally.
# Suggested local flow for your stack:
# npm run typecheck && npm run lint && npm run test:unit && npm run test:i && npm run build

npm run typecheck
npm run lint
npm run test:unit
npm run test:i
npm run build
