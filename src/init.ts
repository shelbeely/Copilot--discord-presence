import { chmod, mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

// ── template file content ─────────────────────────────────────────────────────

const COPILOT_JSON = `{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "bash": ".github/hooks/scripts/session-start.sh",
        "cwd": ".",
        "timeoutSec": 120
      }
    ],
    "agentStop": [
      {
        "type": "command",
        "bash": ".github/hooks/scripts/validate.sh",
        "cwd": ".",
        "timeoutSec": 30
      }
    ]
  }
}
`

const SESSION_START_SH = `#!/usr/bin/env bash
# session-start.sh — added by copilot-discord-presence
# Starts the Discord bot presence daemon at the beginning of each Copilot session.
# Requires: DISCORD_BOT_TOKEN secret in Settings → Environments → copilot
set -euo pipefail

# Install the package globally if not already available (fallback for non-action setups)
if ! command -v copilot-discord-presence &>/dev/null; then
  echo "[copilot-presence] Installing copilot-discord-presence globally..."
  npm install -g copilot-discord-presence
fi

if [ -n "\${DISCORD_BOT_TOKEN:-}" ]; then
  copilot-discord-presence --bot &
  BOT_PID=$!
  echo "\${BOT_PID}" > /tmp/copilot-bot-daemon.pid
  echo "[copilot-presence] Bot presence daemon started (PID: \${BOT_PID})"
else
  echo "[copilot-presence] DISCORD_BOT_TOKEN not set — bot presence daemon skipped."
  echo "  Add it as a secret: Settings → Environments → copilot → Secrets → DISCORD_BOT_TOKEN"
fi
`

const VALIDATE_SH = `#!/usr/bin/env bash
# validate.sh — added by copilot-discord-presence
# Stops the Discord bot presence daemon at the end of each Copilot session.
set -euo pipefail

if [ -f /tmp/copilot-bot-daemon.pid ]; then
  BOT_PID=$(cat /tmp/copilot-bot-daemon.pid)
  if kill -0 "\${BOT_PID}" 2>/dev/null; then
    echo "[copilot-presence] Stopping bot presence daemon (PID: \${BOT_PID})..."
    kill "\${BOT_PID}" 2>/dev/null || true
    for _ in 1 2 3; do
      sleep 1
      kill -0 "\${BOT_PID}" 2>/dev/null || break
    done
  fi
  rm -f /tmp/copilot-bot-daemon.pid
  echo "[copilot-presence] Bot presence daemon stopped."
fi
`

const SETUP_STEPS_YML = `name: "Copilot Setup Steps"

# Run automatically when this file changes to validate it, and allow manual
# testing from the Actions tab.
on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  # The job MUST be called \`copilot-setup-steps\` or it will not be picked up by Copilot.
  copilot-setup-steps:
    runs-on: ubuntu-latest
    # The \`copilot\` environment gives access to the DISCORD_BOT_TOKEN secret.
    environment: copilot

    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Discord presence for Copilot
        uses: shelbeely/Copilot--discord-presence@v1
`

// ── file descriptors ──────────────────────────────────────────────────────────

interface TemplateFile {
  path: string
  content: string
  executable?: boolean
  skipIfExists?: boolean
}

function buildFiles(cwd: string): TemplateFile[] {
  return [
    {
      path: join(cwd, ".github/hooks/scripts/session-start.sh"),
      content: SESSION_START_SH,
      executable: true,
    },
    {
      path: join(cwd, ".github/hooks/scripts/validate.sh"),
      content: VALIDATE_SH,
      executable: true,
    },
    {
      path: join(cwd, ".github/hooks/copilot.json"),
      content: COPILOT_JSON,
      skipIfExists: true,
    },
    {
      path: join(cwd, ".github/workflows/copilot-setup-steps.yml"),
      content: SETUP_STEPS_YML,
      skipIfExists: true,
    },
  ]
}

// ── main ──────────────────────────────────────────────────────────────────────

export async function runInit(): Promise<void> {
  const cwd = process.cwd()
  const files = buildFiles(cwd)

  console.log(`[copilot-presence] Initializing in ${cwd}...\n`)

  for (const file of files) {
    const dir = file.path.substring(0, file.path.lastIndexOf("/"))
    await mkdir(dir, { recursive: true })

    if (file.skipIfExists) {
      const existing = Bun.file(file.path)
      if (await existing.exists()) {
        console.log(`  ⚠  ${relativePath(cwd, file.path)} already exists — skipping`)
        continue
      }
    }

    await writeFile(file.path, file.content, "utf8")

    if (file.executable) {
      await chmod(file.path, 0o755)
    }

    console.log(`  ✔  ${relativePath(cwd, file.path)}`)
  }

  console.log(`
✅  copilot-discord-presence initialized!

Next steps:
  1. Add your bot token as a secret:
     GitHub → Settings → Environments → copilot → Secrets → New secret
     Name:  DISCORD_BOT_TOKEN
     Value: your Discord bot token

  2. Commit the new files:
     git add .github && git commit -m "chore: add copilot-discord-presence"
     git push

  3. Copilot will show Discord presence on its next session. 🎮
`)
}

function relativePath(cwd: string, abs: string): string {
  return abs.startsWith(cwd) ? abs.slice(cwd.length + 1) : abs
}
