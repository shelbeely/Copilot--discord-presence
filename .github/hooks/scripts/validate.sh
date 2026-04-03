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

# Stop the Discord bot presence daemon if it was started at session-start.
if [ -f /tmp/copilot-bot-daemon.pid ]; then
  BOT_PID=$(cat /tmp/copilot-bot-daemon.pid)
  if kill -0 "${BOT_PID}" 2>/dev/null; then
    echo "[copilot-presence] Stopping bot presence daemon (PID: ${BOT_PID})..."
    kill "${BOT_PID}" 2>/dev/null || true
    # Wait up to 3 seconds for a clean shutdown (SIGTERM → clearActivity → disconnect)
    for _ in 1 2 3; do
      sleep 1
      kill -0 "${BOT_PID}" 2>/dev/null || break
    done
  fi
  rm -f /tmp/copilot-bot-daemon.pid
  echo "[copilot-presence] Bot presence daemon stopped."
fi
