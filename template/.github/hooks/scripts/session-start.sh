#!/usr/bin/env bash
# session-start.sh — added by copilot-discord-presence
# Starts the Discord bot presence daemon at the beginning of each Copilot session.
# Requires: DISCORD_BOT_TOKEN secret in Settings → Environments → copilot
set -euo pipefail

# Install the package globally if not already available (fallback for non-action setups)
if ! command -v copilot-discord-presence &>/dev/null; then
  echo "[copilot-presence] Installing copilot-discord-presence globally..."
  npm install -g copilot-discord-presence
fi

if [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
  copilot-discord-presence --bot &
  BOT_PID=$!
  echo "${BOT_PID}" > /tmp/copilot-bot-daemon.pid
  echo "[copilot-presence] Bot presence daemon started (PID: ${BOT_PID})"
else
  echo "[copilot-presence] DISCORD_BOT_TOKEN not set — bot presence daemon skipped."
  echo "  Add it as a secret: Settings → Environments → copilot → Secrets → DISCORD_BOT_TOKEN"
fi
