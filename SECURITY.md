# Security Policy

## Supported versions

Only the latest minor version is supported. Security fixes are released as patch versions against that line.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

Please report security issues privately via GitHub's security advisory feature:

[Report a vulnerability →](https://github.com/josorio7122/pi-caveman/security/advisories/new)

You can also email: josorio7122@gmail.com

I'll acknowledge within 72 hours and provide a fix timeline within 7 days. Do not open a public issue for security reports.

## Scope

In scope:
- The runtime flag writer/reader (`src/config/flag.ts`) — `safeWriteFlag` and `readFlag` are explicitly hardened against symlink attacks (refuses symlink flag paths, validates the flag-dir's `lstat` before writing, bounds content size, validates content as a known mode). Bypasses of those guards are in scope.
- The bootstrap surface (`src/bootstrap/`) — `before_agent_start` ruleset assembly, mode activation, on-input/on-session-start/on-session-compact handlers.
- The slash commands (`src/commands/`) and the public extension entrypoint (`src/index.ts`, `src/api.ts`).
- The cavecrew subagent loader and tool mapping (`src/subagents/`).
- The stats reader (`src/stats/`) — anything a malformed pi session file could trigger.

Out of scope:
- Vendored upstream caveman content under `vendor/caveman/` — that lives untouched; report upstream issues at [caveman](https://github.com/juliusbrussee/caveman). Pi-caveman-specific issues (the bootstrap glue under `src/`) report here.
- Vulnerabilities in pi's own runtime (`@mariozechner/pi-coding-agent`, `@mariozechner/pi-ai`) — report upstream at [pi-mono](https://github.com/badlogic/pi-mono).
- Vulnerabilities in the underlying LLM provider (Anthropic, OpenAI, etc.) — report to them directly.
- Dependency vulnerabilities in typebox / pi-tui without a pi-caveman-specific attack vector — covered by upstream.
