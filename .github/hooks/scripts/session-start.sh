#!/usr/bin/env bash
# session-start.sh — runs at the start of every Copilot cloud agent session.
# By this point, copilot-setup-steps.yml has already installed Bun and
# run `bun install`, so this script just verifies the environment is healthy.
set -euo pipefail

echo "[copilot-presence] Session started at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# Verify bun is available
if ! command -v bun &>/dev/null; then
  echo "[copilot-presence] ERROR: bun not found. Ensure copilot-setup-steps.yml has run." >&2
  exit 1
fi

echo "[copilot-presence] Runtime: $(bun --version)"

# Verify node_modules are present (installed by setup steps)
if [ ! -d "node_modules" ]; then
  echo "[copilot-presence] node_modules missing — running bun install..."
  bun install --frozen-lockfile
fi

echo "[copilot-presence] Environment ready."
