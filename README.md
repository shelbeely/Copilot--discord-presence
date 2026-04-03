# copilot-discord-presence

[![npm version](https://img.shields.io/npm/v/copilot-discord-presence.svg)](https://www.npmjs.com/package/copilot-discord-presence)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어](README.ko.md) | English

Display your [GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) activity in Discord Rich Presence. Shows which repository Copilot is actively coding in, what task it's working on, and whether it's idle or queued.

## Features

- **Real-time coding status** — Shows when Copilot cloud agent is actively running, queued, or idle
- **Task display** — Shows the current task title (from the workflow run's `display_title`)
- **Repo context** — Shows which `owner/repo` Copilot is working in
- **Multi-repo support** — Watch multiple repositories simultaneously
- **Korean language support** — Proper Korean particle handling (이/가, 을/를, 은/는)
- **Auto-reconnect** — Handles Discord disconnections gracefully

## How It Works

GitHub Copilot cloud agent executes your coding tasks inside ephemeral **GitHub Actions** environments. This daemon polls the GitHub Actions API every 30 seconds (configurable) looking for workflow runs triggered by `github-copilot[bot]`. When a run is found, Discord Rich Presence is updated to show what Copilot is working on.

### Presence States

| State | English | Korean |
|-------|---------|--------|
| Active | `Copilot is coding: Fix auth bug` | `Copilot이 코딩중: Fix auth bug` |
| Queued | `Copilot is preparing: Add dark mode` | `Copilot이 준비중: Add dark mode` |
| Idle | `Copilot cloud agent is idle` | `Copilot이 휴식중` |

## Installation

```bash
# Using bun (recommended)
bun add -g copilot-discord-presence

# Using npm
npm install -g copilot-discord-presence
```

## Quick Start

1. **Create a GitHub Personal Access Token** with `repo` (Actions read) permissions at [github.com/settings/tokens](https://github.com/settings/tokens)

2. **Configure** — create `~/.discord-presence.json`:

```json
{
  "githubToken": "ghp_YOUR_TOKEN_HERE",
  "repos": [
    { "owner": "myorg", "repo": "myrepo" }
  ]
}
```

3. **Run**:

```bash
copilot-discord-presence
```

Or with environment variables only:

```bash
GITHUB_TOKEN=ghp_... COPILOT_DISCORD_REPOS=myorg/myrepo copilot-discord-presence
```

## Configuration

### Config File

Create `.discord-presence.json` in your project directory or home directory (`~`):

```json
{
  "enabled": true,
  "githubToken": "ghp_YOUR_TOKEN_HERE",
  "repos": [
    { "owner": "myorg", "repo": "backend" },
    { "owner": "myorg", "repo": "frontend" }
  ],
  "pollInterval": 30,
  "applicationId": "YOUR_DISCORD_APP_ID",
  "language": "en"
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token (also accepts `COPILOT_DISCORD_GITHUB_TOKEN`) |
| `COPILOT_DISCORD_REPOS` | Comma-separated list: `owner/repo,owner/repo2` |
| `COPILOT_DISCORD_OWNER` | Single repo owner (use with `COPILOT_DISCORD_REPO`) |
| `COPILOT_DISCORD_REPO` | Single repo name |
| `COPILOT_DISCORD_ENABLED` | Set to `false` to disable |
| `COPILOT_DISCORD_CLIENT_ID` | Custom Discord Application ID |
| `COPILOT_DISCORD_LANGUAGE` | `en` or `ko` |
| `COPILOT_DISCORD_POLL_INTERVAL` | Polling interval in seconds (default: `30`) |

### Config File Priority

1. Project directory: `.discord-presence.json`
2. Home directory: `~/.discord-presence.json`
3. Environment variables

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable the daemon |
| `githubToken` | `string` | — | **Required.** GitHub PAT with Actions read access |
| `repos` | `Array<{owner, repo}>` | — | **Required.** Repositories to watch |
| `pollInterval` | `number` | `30` | How often to poll GitHub API (seconds) |
| `applicationId` | `string` | built-in | Custom Discord Application ID |
| `language` | `string` | `"en"` | Display language (`"en"` or `"ko"`) |

## Custom Discord Application

For custom branding (your own app name and images in Discord):

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to **Rich Presence → Art Assets**
4. Upload an image named `copilot-logo`
5. Copy the **Application ID** from General Information
6. Add to your config:

```json
{
  "applicationId": "YOUR_APPLICATION_ID"
}
```

## GitHub Token Permissions

The minimum required permissions for a fine-grained PAT:

- **Actions** — Read (to list workflow runs)

For classic tokens, the `repo` scope is sufficient.

## Development

```bash
# Install dependencies
bun install

# Run in dev mode (watches for changes)
bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format

# Build
bun run build
```

## Architecture

```
src/
├── index.ts              # Entry point — starts daemon when run directly
├── daemon.ts             # Core polling daemon
├── config.ts             # Configuration management
├── types/
│   └── index.ts          # TypeScript type definitions
├── services/
│   ├── discord-rpc.ts    # Discord RPC service (singleton, auto-reconnect)
│   └── github.ts         # GitHub Actions API polling
└── utils/
    └── particle.ts       # Korean particle handling (이/가, 을/를, 은/는)
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`bun test`)
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Related Projects

- [GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) — The AI coding agent this tool monitors
- [@xhayper/discord-rpc](https://github.com/xhayper/discord-rpc) — Discord RPC library used by this project

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
