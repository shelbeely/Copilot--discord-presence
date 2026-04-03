# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-03

### Changed

- **Complete rewrite**: Ported from an OpenCode plugin to a standalone Discord Rich Presence daemon for **GitHub Copilot cloud agent** (formerly Copilot coding agent)
- Package renamed from `opencode-discord-presence` to `copilot-discord-presence`
- Now a CLI daemon (`copilot-discord-presence`) rather than an OpenCode plugin
- Replaced OpenCode event hooks with GitHub Actions API polling (`github-copilot[bot]` actor)

### Added

- `src/daemon.ts` — core polling daemon replaces `plugin.ts`
- `src/services/github.ts` — GitHub Actions API service for detecting active/queued Copilot runs
- Multi-repo support: watch multiple `owner/repo` pairs simultaneously
- Configurable poll interval (default 30 seconds)
- Three presence states: **active** (coding), **queued** (preparing), **idle**
- Task title display from workflow run `display_title`
- Repository context shown as Discord state (`owner/repo`)
- Korean subject particle support (`이/가`) via new `getSubjectParticle` utility
- `GITHUB_TOKEN` / `COPILOT_DISCORD_GITHUB_TOKEN` env var support
- `COPILOT_DISCORD_REPOS`, `COPILOT_DISCORD_OWNER`, `COPILOT_DISCORD_REPO` env vars
- `COPILOT_DISCORD_POLL_INTERVAL` env var
- Graceful shutdown on `SIGINT`/`SIGTERM`

### Removed

- OpenCode plugin system (`@opencode-ai/plugin` dependency)
- `chat.message` and `event` hooks (no longer applicable)
- Agent/model display (replaced by Copilot task title)

## [0.1.0] - 2026-01-30

### Added

- Initial release of opencode-discord-presence plugin
- Discord Rich Presence integration with OpenCode
- Real-time agent and model display
- Session time tracking with elapsed time
- Korean particle support (을/를, 은/는) for proper Korean grammar
- Idle/active state detection
- Configuration options: `enabled`, `applicationId`
- Singleton Discord RPC service with automatic reconnection
- Full TypeScript support with type definitions
- Biome linting and formatting

[Unreleased]: https://github.com/shelbeely/Copilot--discord-presence/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/shelbeely/Copilot--discord-presence/releases/tag/v1.0.0
[0.1.0]: https://github.com/shelbeely/Copilot--discord-presence/releases/tag/v0.1.0
