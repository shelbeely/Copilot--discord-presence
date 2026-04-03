import type { DiscordPresenceOptions, Language, PresenceConfig, RepoConfig } from "./types/index.js"

export const DEFAULT_CLIENT_ID = "1466770544748662819"
export const DEFAULT_POLL_INTERVAL = 30

function parseLanguage(lang?: string): Language {
  const normalized = lang?.toLowerCase()
  if (normalized === "ko" || normalized === "kr" || normalized === "korean") return "ko"
  return "en"
}

function parseRepos(raw?: string): RepoConfig[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const parts = entry.split("/")
      if (parts.length === 2 && parts[0] && parts[1]) {
        return [{ owner: parts[0], repo: parts[1] }]
      }
      return []
    })
}

export function getConfig(options?: DiscordPresenceOptions): PresenceConfig {
  const envEnabled = process.env.COPILOT_DISCORD_ENABLED
  const envClientId = process.env.COPILOT_DISCORD_CLIENT_ID
  const envLanguage = process.env.COPILOT_DISCORD_LANGUAGE
  const envToken = process.env.GITHUB_TOKEN ?? process.env.COPILOT_DISCORD_GITHUB_TOKEN
  const envRepos = process.env.COPILOT_DISCORD_REPOS
  const envOwner = process.env.COPILOT_DISCORD_OWNER
  const envRepo = process.env.COPILOT_DISCORD_REPO
  const envPollInterval = process.env.COPILOT_DISCORD_POLL_INTERVAL

  // Build repos list: config file → single env owner/repo → multi env repos
  let repos: RepoConfig[] = options?.repos ?? []
  if (repos.length === 0 && envOwner && envRepo) {
    repos = [{ owner: envOwner, repo: envRepo }]
  }
  if (repos.length === 0 && envRepos) {
    repos = parseRepos(envRepos)
  }

  return {
    enabled: options?.enabled ?? envEnabled !== "false",
    clientId: options?.applicationId ?? envClientId ?? DEFAULT_CLIENT_ID,
    language: parseLanguage(options?.language ?? envLanguage),
    githubToken: options?.githubToken ?? envToken ?? "",
    repos,
    pollInterval:
      options?.pollInterval ?? (envPollInterval ? Number(envPollInterval) : DEFAULT_POLL_INTERVAL),
  }
}
