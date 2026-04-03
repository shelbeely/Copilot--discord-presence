# Copilot Instructions — copilot-discord-presence

## What this repository does

`copilot-discord-presence` is a standalone CLI daemon written in TypeScript. It polls the GitHub
Actions API every N seconds looking for workflow runs triggered by `github-copilot[bot]` and
reflects the current status (active coding, queued, or idle) in Discord Rich Presence via Discord
RPC. It is **not** an OpenCode plugin — it runs as a background process independent of any editor.

## Tech stack

- **Runtime**: Bun (≥ 1.1.0). Always use `bun` — never `node`, `ts-node`, or `npx`.
- **Language**: TypeScript 5, strict mode, ESNext modules (`"module": "ESNext"`, `"moduleResolution": "bundler"`).
- **Linter/Formatter**: Biome (`biome.json`). Do **not** use ESLint or Prettier.
- **Discord RPC**: `@xhayper/discord-rpc`
- **GitHub API**: native `fetch` (no Octokit)
- **No test framework** is currently set up. `bun test` will run with no test files.

## Copilot cloud agent environment setup

Copilot's ephemeral GitHub Actions environment is pre-provisioned by
`.github/workflows/copilot-setup-steps.yml`. This workflow installs Bun and runs
`bun install --frozen-lockfile` **before** the agent starts, so all tools and
dependencies are immediately available.

Hook scripts in `.github/hooks/scripts/` run at agent lifecycle points:
- `session-start.sh` — verifies the environment at the start of each session.
- `validate.sh` — runs `typecheck → lint → build` after the agent stops, mirroring CI.

To pass sensitive values (e.g. `GITHUB_TOKEN` for testing) into Copilot's environment,
add them as secrets or variables in the **`copilot` GitHub Actions environment** via
**Settings → Environments → copilot**.

## Build and validate — run in this exact order

```bash
# 1. Install dependencies (always run first after any checkout)
bun install

# 2. Type-check (no emit)
bun run typecheck      # → npx tsc --noEmit

# 3. Lint (Biome — also checks formatting)
bun run lint           # → biome check src/

# 4. Auto-fix formatting and safe lint issues
bun run lint:fix       # → biome check --write src/

# 5. Build (emits to dist/)
bun run build          # → tsc -p tsconfig.build.json
```

If `bun run lint` fails with only formatting errors, run `bun run lint:fix` first, then re-check.
The CI workflow (`.github/workflows/ci.yml`) runs steps 1–5 in that order on every PR.

## TypeScript import conventions — critical

All imports of local `.ts` files **must use `.js` extensions**:

```ts
import { getConfig } from "./config.js"     // ✅ correct
import { getConfig } from "./config.ts"     // ❌ wrong
import { getConfig } from "./config"        // ❌ wrong
```

This is required by TypeScript ESM with `"moduleResolution": "bundler"`.

## Code style (enforced by Biome)

- **No semicolons** at the end of statements.
- **Double quotes** for strings.
- **2-space indentation**, line width 100.
- Prefer `const` over `let` when value never changes.
- Use template literals instead of string concatenation.
- `noExplicitAny` is a warning — avoid `any`; use `unknown` and narrow types.

## Repository layout

```
src/
├── index.ts              # Entry point; starts daemon when run as CLI (import.meta.main)
├── daemon.ts             # Core polling loop and Discord presence updates
├── config.ts             # Config loading (file + env vars); exports getConfig()
├── types/index.ts        # All shared TypeScript interfaces and types
├── services/
│   ├── discord-rpc.ts    # DiscordRPCService — singleton, auto-reconnects
│   └── github.ts         # GitHubService — polls Actions API for github-copilot[bot] runs
└── utils/
    └── particle.ts       # Korean particle helpers (이/가, 을/를, 은/는)

.github/
├── copilot-instructions.md   # This file
├── hooks/
│   ├── copilot.json              # Hook definitions (sessionStart, agentStop)
│   └── scripts/
│       ├── session-start.sh      # Verifies bun + node_modules at session start
│       └── validate.sh           # Runs typecheck + lint + build after agent stops
└── workflows/
    ├── ci.yml                    # Runs on push/PR: install → typecheck → lint → build
    ├── copilot-setup-steps.yml   # Pre-provisions Bun + deps in Copilot's environment
    └── publish.yml               # Runs on release: build → npm publish

dist/                     # TypeScript build output (gitignored)
biome.json                # Biome lint + format config
tsconfig.json             # Base tsconfig (noEmit: true, used by typecheck)
tsconfig.build.json       # Build tsconfig (emits to dist/)
package.json              # Package metadata; name: copilot-discord-presence; bin entry present
```

## Key environment variables

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Required. GitHub PAT with Actions read permission. |
| `COPILOT_DISCORD_REPOS` | Comma-separated `owner/repo` list to watch. |
| `COPILOT_DISCORD_OWNER` + `COPILOT_DISCORD_REPO` | Alternative for a single repo. |
| `COPILOT_DISCORD_POLL_INTERVAL` | Polling interval in seconds (default: 30). |
| `COPILOT_DISCORD_CLIENT_ID` | Custom Discord Application ID. |
| `COPILOT_DISCORD_LANGUAGE` | `en` or `ko` (default: `en`). |

## Configuration file

Users can create `~/.discord-presence.json` or `.discord-presence.json` in the project root:

```json
{
  "githubToken": "ghp_...",
  "repos": [{ "owner": "myorg", "repo": "myrepo" }],
  "pollInterval": 30,
  "language": "en"
}
```

## How the daemon detects Copilot cloud agent

It calls `GET /repos/{owner}/{repo}/actions/runs?actor=github-copilot%5Bbot%5D&status=in_progress`
(and `status=queued`). Any result means Copilot is working. The `display_title` field of the
workflow run is shown as the task description in Discord.

## Trust these instructions

Trust the commands and paths documented here. Only search the codebase if something appears
to be missing or incorrect.
