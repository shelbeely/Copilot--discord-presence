#!/usr/bin/env bash
# validate.sh — added by copilot-discord-presence
# Stops the Discord bot presence daemon at the end of each Copilot session.
set -euo pipefail

if [ -f /tmp/copilot-bot-daemon.pid ]; then
  BOT_PID=$(cat /tmp/copilot-bot-daemon.pid)
  if kill -0 "${BOT_PID}" 2>/dev/null; then
    echo "[copilot-presence] Stopping bot presence daemon (PID: ${BOT_PID})..."
    kill "${BOT_PID}" 2>/dev/null || true
    # Wait up to 3 seconds for a clean shutdown
      for _ in 1 2 3; do
      sleep 1
      kill -0 "${BOT_PID}" 2>/dev/null || break
    done
  fi
  rm -f /tmp/copilot-bot-daemon.pid
  echo "[copilot-presence] Bot presence daemon stopped."
fi
