# pi-caveman

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![CI](https://github.com/josorio7122/pi-caveman/actions/workflows/check.yml/badge.svg)](https://github.com/josorio7122/pi-caveman/actions/workflows/check.yml)

caveman ultra-compressed output mode for [pi](https://github.com/badlogic/pi-coding-agent).

## Install

```bash
pi install git:github.com/josorio7122/pi-caveman@v0.1.0
```

Dev mode:

```bash
pi -e /path/to/pi-caveman/src/index.ts
```

## Features

| Feature | How to use |
|---|---|
| Caveman intensity modes | `/caveman lite\|full\|ultra\|wenyan-{lite,full,ultra}\|off` |
| Terse commits | `/caveman-commit` |
| One-line code review | `/caveman-review` |
| Drop rule into repo | `/caveman-init [--force]` |
| Token stats | `/caveman-stats [--share] [--all] [--since <ISO>]` |
| Help card | `/caveman-help` |
| Cavecrew subagents | `agent` tool with `cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer` |

See the upstream [caveman](https://github.com/juliusbrussee/caveman) for the source rules.

## Coexistence

`pi-caveman` plays nicely alongside `pi-superpowers`. Pi runs `before_agent_start` handlers in registration order, chaining `event.systemPrompt` through them — superpowers' addendum lands first, caveman's ruleset lands second. Caveman tells the model how to *speak*; superpowers tells it *what skills exist*.

## Configuration

| Where | What |
|---|---|
| `CAVEMAN_DEFAULT_MODE` env var | one of `lite`, `full`, `ultra`, `wenyan-{lite,full,ultra}`, `off` (commit/review/compress are picked via slash commands) |
| `~/.config/caveman/config.json` (`{"defaultMode":"..."}`) | persisted default, overridden by env var |
| `~/.claude/.caveman-active` | runtime flag, auto-managed; honors `CLAUDE_CONFIG_DIR` |

## Troubleshooting

- **Caveman activated but model still verbose:** verify `before_agent_start` runs — set `CAVEMAN_DEBUG=1`, look for stderr output. If `pi-superpowers` is registered first, its addendum may reset the system prompt; caveman appends after, so this should not happen — file an issue with the prompt that triggered drift.
- **`/caveman-stats` returns "no active session":** pi was launched with `--no-session`. Stats reads `ctx.sessionManager.getSessionFile()`, which is null in that mode.
- **Cavecrew agents not visible:** verify `vendor/caveman/agents/` populated (`bash scripts/sync-upstream.sh main`). Check `pi list` for `pi-caveman`.

## Sync workflow

```bash
bash scripts/sync-upstream.sh <tag>
npm run parity-check
npm run check
PI_BIN=$(which pi) npm run test:e2e
git commit -m "chore: sync caveman to <tag>"
git tag <tag> && git push --follow-tags
```

## Spec & plan

- Design: [`docs/superpowers/specs/2026-05-01-pi-caveman-design.md`](docs/superpowers/specs/2026-05-01-pi-caveman-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-05-01-pi-caveman.md`](docs/superpowers/plans/2026-05-01-pi-caveman.md)

## License

MIT. Upstream caveman content under `vendor/caveman/` retains its [MIT license](vendor/caveman/LICENSE).
