import type { SetActivity } from "@xhayper/discord-rpc"

export type Language = "en" | "ko"

export interface RepoConfig {
  owner: string
  repo: string
}

export interface PresenceConfig {
  enabled: boolean
  clientId: string
  language: Language
  githubToken: string
  repos: RepoConfig[]
  pollInterval: number
}

export interface DiscordPresenceOptions {
  enabled?: boolean
  applicationId?: string
  language?: string
  githubToken?: string
  repos?: RepoConfig[]
  pollInterval?: number
}

export interface CopilotAgentRun {
  id: number
  owner: string
  repo: string
  displayTitle: string
  branch: string
  status: string
  createdAt: string
}

export interface GatewayPayload {
  op: number
  d: unknown
  s?: number | null
  t?: string | null
}

export interface GatewayActivity {
  name: string
  type: number
}

export type { SetActivity }
