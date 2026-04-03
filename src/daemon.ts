import { homedir } from "node:os"
import { join } from "node:path"
import { getConfig } from "./config.js"
import { DiscordRPCService } from "./services/discord-rpc.js"
import { GitHubService } from "./services/github.js"
import type { DiscordPresenceOptions, Language } from "./types/index.js"
import { getSubjectParticle } from "./utils/particle.js"

type PresenceStatus = "active" | "queued" | "idle"

function getPresenceDetails(
  displayTitle: string | null,
  status: PresenceStatus,
  language: Language,
): string {
  if (language === "ko") {
    const particle = getSubjectParticle("Copilot")
    if (status === "idle") return `Copilot${particle} 휴식중`
    if (status === "queued")
      return `Copilot${particle} 준비중${displayTitle ? `: ${displayTitle}` : ""}`
    return `Copilot${particle} 코딩중${displayTitle ? `: ${displayTitle}` : ""}`
  }
  if (status === "idle") return "Copilot cloud agent is idle"
  if (status === "queued") return `Copilot is preparing${displayTitle ? `: ${displayTitle}` : ""}`
  return `Copilot is coding${displayTitle ? `: ${displayTitle}` : ""}`
}

async function loadConfigFile(): Promise<DiscordPresenceOptions | undefined> {
  const paths = [
    join(process.cwd(), ".discord-presence.json"),
    join(homedir(), ".discord-presence.json"),
  ]

  for (const configPath of paths) {
    const file = Bun.file(configPath)
    if (await file.exists()) {
      try {
        return (await file.json()) as DiscordPresenceOptions
      } catch (err) {
        console.warn(`[copilot-presence] Failed to parse config file ${configPath}:`, err)
      }
    }
  }
  return undefined
}

export async function startDaemon(): Promise<void> {
  const fileOptions = await loadConfigFile()
  const config = getConfig(fileOptions)

  if (!config.enabled) {
    console.log("[copilot-presence] Disabled via config")
    return
  }

  if (!config.githubToken) {
    console.error(
      "[copilot-presence] No GitHub token configured.\n" +
        "  Set GITHUB_TOKEN environment variable, or add 'githubToken' to .discord-presence.json",
    )
    process.exit(1)
  }

  if (config.repos.length === 0) {
    console.error(
      "[copilot-presence] No repositories configured.\n" +
        "  Set COPILOT_DISCORD_REPOS=owner/repo (comma-separated for multiple), or add 'repos' to .discord-presence.json",
    )
    process.exit(1)
  }

  const rpc = new DiscordRPCService(config.clientId)
  const github = new GitHubService(config.githubToken)

  const connected = await rpc.connect()
  if (!connected) {
    console.warn("[copilot-presence] Could not connect to Discord — will retry in background")
  }

  const poll = async () => {
    const allActive = (
      await Promise.all(
        config.repos.map(({ owner, repo }) => github.getActiveCopilotRuns(owner, repo)),
      )
    ).flat()

    if (allActive.length > 0) {
      const run = allActive[0]
      await rpc.setPresence(
        getPresenceDetails(run.displayTitle, "active", config.language),
        `${run.owner}/${run.repo}`,
      )
      return
    }

    const allQueued = (
      await Promise.all(
        config.repos.map(({ owner, repo }) => github.getQueuedCopilotRuns(owner, repo)),
      )
    ).flat()

    if (allQueued.length > 0) {
      const run = allQueued[0]
      await rpc.setPresence(
        getPresenceDetails(run.displayTitle, "queued", config.language),
        `${run.owner}/${run.repo}`,
      )
      return
    }

    await rpc.setPresence(getPresenceDetails(null, "idle", config.language))
  }

  await poll()

  const repoList = config.repos.map((r) => `${r.owner}/${r.repo}`).join(", ")
  console.log(`[copilot-presence] Watching ${repoList} — polling every ${config.pollInterval}s`)

  const timer = setInterval(poll, config.pollInterval * 1000)

  const shutdown = () => {
    clearInterval(timer)
    rpc.clear().finally(() => process.exit(0))
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}
