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

# Start Discord bot presence daemon in the background if a bot token is available.
# The token must be stored as a secret in the 'copilot' GitHub Actions environment
# (Settings → Environments → copilot → Secrets → DISCORD_BOT_TOKEN).
if [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
  bun run src/bot-daemon.ts &
  BOT_PID=$!
  echo "[copilot-presence] Bot presence daemon started (PID: ${BOT_PID})"
  echo "${BOT_PID}" > /tmp/copilot-bot-daemon.pid
else
  echo "[copilot-presence] DISCORD_BOT_TOKEN not set — bot presence daemon skipped."
fi

