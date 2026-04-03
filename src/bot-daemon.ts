import { DiscordGatewayService } from "./services/discord-gateway.js"
import { GitHubService } from "./services/github.js"
import type { Language } from "./types/index.js"
import { getSubjectParticle } from "./utils/particle.js"

function buildActivityName(displayTitle: string, language: Language): string {
  if (language === "ko") {
    const particle = getSubjectParticle("Copilot")
    return `Copilot${particle} 코딩중: ${displayTitle}`
  }
  return `Copilot is coding: ${displayTitle}`
}

function parseLanguage(raw?: string): Language {
  const n = raw?.toLowerCase()
  if (n === "ko" || n === "kr" || n === "korean") return "ko"
  return "en"
}

export async function startBotDaemon(): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.error(
      "[copilot-presence] DISCORD_BOT_TOKEN is not set.\n" +
        "  Add it as a secret in Settings → Environments → copilot.",
    )
    process.exit(1)
  }

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    console.error("[copilot-presence] GITHUB_TOKEN is not set.")
    process.exit(1)
  }

  const language = parseLanguage(process.env.COPILOT_DISCORD_LANGUAGE)

  // In GitHub Actions, GITHUB_REPOSITORY is "owner/repo" and GITHUB_RUN_ID is the numeric run ID
  const repository = process.env.GITHUB_REPOSITORY
  const runId = process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : null

  let displayTitle = "Coding task"

  if (repository && runId) {
    const parts = repository.split("/")
    if (parts.length === 2 && parts[0] && parts[1]) {
      const [owner, repo] = parts
      const github = new GitHubService(githubToken)
      try {
        const run = await github.getRun(owner, repo, runId)
        if (run?.displayTitle) {
          displayTitle = run.displayTitle
        }
      } catch (err) {
        console.warn("[copilot-presence] Could not fetch run title — using default:", err)
      }
    }
  }

  const activityName = buildActivityName(displayTitle, language)

  const gateway = new DiscordGatewayService(botToken)
  gateway.connect()
  gateway.setActivity(activityName)

  console.log(`[copilot-presence] Bot daemon started — activity: "${activityName}"`)

  const shutdown = () => {
    console.log("[copilot-presence] Bot daemon shutting down...")
    gateway.clearActivity()
    // Brief delay so the presence-clear message can be sent before the socket closes
    setTimeout(() => {
      gateway.disconnect()
      process.exit(0)
    }, 500)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  // Keep the process alive — the Gateway heartbeat loop and event handlers do the work
  await new Promise<never>(() => {})
}

if (import.meta.main) {
  startBotDaemon()
}
