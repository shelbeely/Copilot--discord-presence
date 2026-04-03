#!/usr/bin/env bash
# validate.sh — runs after the Copilot cloud agent finishes its work (agentStop hook).
# Mirrors the checks run by CI (.github/workflows/ci.yml) so the agent can
# catch regressions before a pull request is opened.
set -euo pipefail

echo "[copilot-presence] Running post-agent validation..."

echo "[copilot-presence] → Type check"
bun run typecheck

echo "[copilot-presence] → Lint"
bun run lint

echo "[copilot-presence] → Build"
bun run build

echo "[copilot-presence] All checks passed."
