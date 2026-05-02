# Contributing to pi-caveman

Thanks for considering a contribution! This project is small and opinionated — please follow the conventions below.

## Development setup

```bash
git clone https://github.com/josorio7122/pi-caveman
cd pi-caveman
npm install
npm run check          # lint + blank-line check + typecheck + unit tests + parity check
```

## Running end-to-end tests

E2E tests spawn the real `pi` CLI and assert on caveman's mode-switching, stats short-circuit, and cavecrew subagent output. They live in `*-e2e.test.ts` files, are excluded from the default `npm run check`, and use a dedicated `vitest.e2e.config.ts`.

```bash
export PI_BIN=$(which pi)   # or /usr/local/bin/pi if installed globally
npm run test:e2e            # sets PI_E2E=1 and runs the e2e config
```

Two env vars are involved:

- **`PI_E2E=1`** — the intent flag that opts you into e2e runs. Set automatically by `npm run test:e2e`.
- **`PI_BIN`** — the path to the compiled `pi` binary. Without it, the e2e suite self-skips cleanly.

## Code style

- **Pi compliance is non-negotiable.** Never shadow pi's `Theme`, `ThemeColor`, `ToolDefinition`, `ExtensionContext`, or `AgentToolResult` types. Import directly from `@mariozechner/pi-coding-agent`.
- **No raw ANSI escapes** in production code. Use pi's `theme.fg(slot, text)` / `theme.strikethrough(text)` / etc.
- **Strings: don't assemble literal text with `+` or array-then-`.join()`.** Multi-line prose uses a template literal + `.replace(/\s+/g, " ").trim()` at load time (see `src/common/strings.ts` and its `flatten` helper). Simple variable concat (`pad + line`) is fine — the rule is about building one string from multiple string *literals*.
- **Typebox for schemas**, not zod. Pi bundles typebox as a core peer package. For string enums, use `Type.Union([Type.Literal(...)])` for local validation (`Value.Check`) and `StringEnum` from `@mariozechner/pi-ai` for tool-parameter schemas sent to LLMs.
- **Biome enforces:** no `any`, no non-null assertions (`!`), no barrel files (except `api.ts`), max 2 params per function, 120-char lines.
- **File size:** aim for < 200 LOC per file. Split by responsibility when exceeded.
- **Tests colocate:** `foo.ts` → `foo.test.ts`. E2E tests use the `-e2e.test.ts` suffix.

## Commit messages

- Format: `type(scope): description` — conventional commits. Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`, `style`.
- **No `Co-Authored-By` trailers** — especially no AI attribution.
- Breaking changes use `!`: `feat(api)!: rename safeWriteFlag signature`.

## Pull requests

- Branch off `main`. Name: `feature/<short-name>`, `fix/<short-name>`.
- Open a PR early if the change is non-trivial — discuss approach before you invest hours.
- CI (`npm run check`) must pass before merge. Review is required for non-trivial changes.

## What belongs in pi-caveman

- Caveman intensity-mode activation, ruleset assembly, and the `before_agent_start` glue.
- The six slash commands (`/caveman`, `/caveman-commit`, `/caveman-review`, `/caveman-init`, `/caveman-stats`, `/caveman-help`).
- Cavecrew subagent registration (`cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer`).
- The runtime flag (`safeWriteFlag` / `readFlag`) and config resolution (`CAVEMAN_DEFAULT_MODE`, `~/.config/caveman/config.json`).
- Token-stats reader against pi's session manager.

## What does NOT belong

- Edits to vendored caveman content under `vendor/caveman/` — that's a sync surface, not a source. Use `bash scripts/sync-upstream.sh <tag>` and run `npm run parity-check`.
- Changes to pi-core types or contracts (upstream to pi-mono).
- New compression rules / mode dialects — those belong upstream at [caveman](https://github.com/juliusbrussee/caveman).

## Reporting issues

Use the GitHub issue tracker. For security issues, see [SECURITY.md](SECURITY.md).
