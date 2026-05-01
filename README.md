# pi-caveman

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

## License

MIT. Upstream caveman content under `vendor/caveman/` retains its [MIT license](vendor/caveman/LICENSE).
