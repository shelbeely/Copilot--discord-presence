import type { CopilotAgentRun } from "../types/index.js"

const GITHUB_API_BASE = "https://api.github.com"
// The bot login used by Copilot cloud agent when triggering GitHub Actions runs
const COPILOT_BOT_ACTOR = "github-copilot[bot]"

export class GitHubService {
  constructor(private token: string) {}

  private async fetchAPI(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    if (!response.ok) {
      console.warn(
        `[copilot-presence] GitHub API error: ${response.status} ${response.statusText} — ${url}`,
      )
      return null
    }
    return response.json()
  }

  private async getRunsByStatus(
    owner: string,
    repo: string,
    status: string,
  ): Promise<CopilotAgentRun[]> {
    const actor = encodeURIComponent(COPILOT_BOT_ACTOR)
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?actor=${actor}&status=${status}&per_page=5`
    const data = (await this.fetchAPI(url)) as { workflow_runs?: Record<string, unknown>[] } | null
    if (!data?.workflow_runs) return []
    return data.workflow_runs.map((run) => ({
      id: run.id as number,
      owner,
      repo,
      displayTitle:
        (run.display_title as string) ||
        ((run.head_commit as Record<string, unknown>)?.message as string | undefined)?.split(
          "\n",
        )[0] ||
        "Coding task",
      branch: (run.head_branch as string) || "",
      status: run.status as string,
      createdAt: run.created_at as string,
    }))
  }

  /** Returns workflow runs currently being executed by Copilot cloud agent. */
  async getActiveCopilotRuns(owner: string, repo: string): Promise<CopilotAgentRun[]> {
    return this.getRunsByStatus(owner, repo, "in_progress")
  }

  /** Returns workflow runs queued (waiting to start) by Copilot cloud agent. */
  async getQueuedCopilotRuns(owner: string, repo: string): Promise<CopilotAgentRun[]> {
    return this.getRunsByStatus(owner, repo, "queued")
  }
}
