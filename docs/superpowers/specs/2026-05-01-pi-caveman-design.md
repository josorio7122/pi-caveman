# pi-caveman — Design Spec

**Date:** 2026-05-01
**Status:** Approved (brainstorming complete)
**Next step:** writing-plans skill produces the implementation plan from this spec.

---

## 1. Purpose

Bring the [caveman](https://github.com/juliusbrussee/caveman) ultra-compressed-output mode to [pi-coding-agent](https://www.npmjs.com/package/@mariozechner/pi-coding-agent) as a thin pi-native package.

Upstream caveman is a Claude Code plugin: `SessionStart` and `UserPromptSubmit` hooks, slash commands as `.toml`, skills as `SKILL.md` directories, and three "cavecrew" subagents. We provide complete feature parity on pi by translating each Claude Code surface to its pi equivalent, **without editing the upstream source tree**. Upstream content lives under `vendor/caveman/` and stays untouched; our code under `src/` glues it to pi.

Pattern reference: [`pi-superpowers`](/Users/josorio/Code/pi-superpowers) — same vendor-then-glue approach, same coding standards.

## 2. Non-goals

- Forking caveman behavior. We mirror, not extend.
- Replacing pi's existing skill or command machinery. We use the standard `pi.skills` manifest and `pi.registerCommand` API.
- Supporting Codex / Gemini. Out of scope; this package targets pi only.
- Shipping a TUI overlay or new theme. Status updates use existing `ctx.ui.setStatus` / `setWidget`.

## 3. User-visible surface

| Surface | Effect |
|---|---|
| `/caveman [lite\|full\|ultra\|wenyan\|wenyan-lite\|wenyan-full\|wenyan-ultra\|off]` | switch intensity, persists in flag file |
| `/caveman-commit` | injects upstream's terse-commit-message prompt as the next user message |
| `/caveman-review` | injects upstream's one-line code-review prompt as the next user message |
| `/caveman-init` | shells out to `vendor/caveman/tools/caveman-init.js` to drop a caveman rule file into the current repo |
| `/caveman-stats [--share] [--all] [--since <ISO>]` | parses the active pi `.jsonl` session file, prints token totals + estimated savings; bypasses the model entirely |
| `/caveman-help` | renders the upstream `caveman-help` skill body |
| `/skill:caveman`, `/skill:caveman-commit`, `/skill:caveman-review`, `/skill:caveman-help`, `/skill:caveman-stats`, `/skill:cavecrew`, `/skill:compress` | auto-discovered by pi from the `pi.skills` manifest |
| `agent` tool dispatch on `cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer` | pi-agents native subagent dispatch with caveman-ultra system prompts |
| Footer status | `🪨 caveman · <mode>` on session start and on every mode change |
| Natural-language activation | `"activate caveman"`, `"talk like caveman"`, `"stop caveman"`, etc. recognised via the same regex matrix upstream uses |
| Flag file | `~/.claude/.caveman-active` (honors `CLAUDE_CONFIG_DIR`) — same path upstream uses, so a Claude Code statusline reads the same value |

## 4. Architecture

### 4.1 Repo layout

```
pi-caveman/
├── src/
│   ├── index.ts                       async-factory entrypoint
│   ├── api.ts                         only barrel
│   ├── bootstrap/
│   │   ├── on-session-start.ts        write flag, set status, NO injection here
│   │   ├── on-before-agent-start.ts   re-inject ruleset every turn, scan /caveman*, mode flips
│   │   ├── on-input.ts                /caveman-stats short-circuit (action:"handled")
│   │   ├── on-session-compact.ts      re-inject after compact (anti-drift)
│   │   ├── ruleset.ts                 pure: read SKILL.md, filter intensity table+examples per mode
│   │   └── activations.ts             regex matrix for /caveman commands + NL phrases
│   ├── commands/
│   │   ├── register.ts                pi.registerCommand × 6
│   │   ├── caveman.ts                 /caveman [arg]
│   │   ├── commit.ts                  /caveman-commit
│   │   ├── review.ts                  /caveman-review
│   │   ├── init.ts                    /caveman-init
│   │   ├── stats.ts                   /caveman-stats
│   │   └── help.ts                    /caveman-help
│   ├── subagents/
│   │   ├── loader.ts                  readdir vendor/caveman/agents/*.md
│   │   ├── tool-mapping.ts            const TOOL_MAP = {Read:"read", ...}
│   │   ├── build-configs.ts           frontmatter+body → AgentConfig
│   │   └── register.ts                createAgentTool + pi.registerTool
│   ├── config/
│   │   ├── modes.ts                   VALID_MODES, INDEPENDENT_MODES, modeLabel
│   │   ├── default-mode.ts            env → ~/.config/caveman/config.json → "full"
│   │   └── flag.ts                    safeWriteFlag, readFlag (1:1 port)
│   ├── stats/
│   │   ├── extract-usage.ts           pure: jsonl entry → Usage | null
│   │   ├── parse.ts                   pure: stream jsonl → totals
│   │   └── render.ts                  pure: totals → caveman-style card
│   ├── ui/
│   │   └── status.ts                  formatStatus(mode), formatWidget(stats?)
│   └── common/
│       ├── paths.ts                   vendorRoot, claudeFlagPath, agentsDir, skillsDir
│       ├── fs.ts                      fileExists
│       └── strings.ts                 flatten
├── vendor/caveman/                    synced from upstream — NEVER edited
│   ├── skills/
│   ├── agents/
│   ├── commands/
│   ├── tools/
│   └── LICENSE
├── scripts/
│   ├── sync-upstream.sh
│   ├── parity-check.ts
│   └── check-blank-lines.sh
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── vitest.e2e.config.ts
├── package.json
├── README.md
├── AGENTS.md
├── CHANGELOG.md
└── LICENSE
```

### 4.2 Package manifest

```json
{
  "name": "pi-caveman",
  "version": "0.1.0",
  "keywords": ["pi-package", "caveman", "tokens", "compression"],
  "license": "MIT",
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"],
    "skills": ["./vendor/caveman/skills"]
  },
  "engines": {"node": ">=20"},
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@sinclair/typebox": "*"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "@iarna/toml": "^2.2.5",
    "pi-agents": "github:josorio7122/pi-agents"
  }
}
```

Peer deps for pi core packages are `"*"` per pi's `docs/packages.md`. `pi-agents` is bundled (mirrors `pi-superpowers`).

## 5. Data flow

### 5.1 Session activation

```
session_start { reason: "startup" | "new" | "resume" | "fork" }
  ├─► default-mode.ts: env CAVEMAN_DEFAULT_MODE → ~/.config/caveman/config.json → "full"
  ├─► flag.ts: safeWriteFlag(claudeFlagPath(), mode)
  ├─► subagents/register.ts: scan vendor/caveman/agents → buildConfigs → createAgentTool → pi.registerTool
  └─► ctx.ui.setStatus("caveman", `🪨 caveman · ${mode}`)

(no system-prompt injection at session_start — pi sends the system prompt
 fresh every turn, so the right place is before_agent_start)
```

### 5.2 Per-turn injection (matches upstream every-turn behavior)

```
before_agent_start { prompt, systemPrompt, systemPromptOptions, ... }
  ├─► detectModeChange(prompt) → null | { mode }
  │     covers: /caveman [arg], /caveman-commit, /caveman-review, /caveman-stats,
  │     "activate caveman", "talk like caveman", "stop caveman"
  ├─► if change: safeWriteFlag(...) + ctx.ui.setStatus(...)
  ├─► resolve effective mode: change?.mode ?? readFlag() ?? getDefaultMode()
  ├─► if mode === "off": return {} (no injection)
  ├─► if INDEPENDENT_MODES.has(mode): return systemPrompt + short activation line
  └─► else: return systemPrompt + buildRuleset(skillMd, mode)
```

`INDEPENDENT_MODES = {"commit", "review", "compress"}` — these have their own skill files and don't take the standard intensity ruleset.

### 5.3 Stats short-circuit

```
input { text, source }
  ├─► if source === "extension": continue
  ├─► if /^\/caveman(?::caveman)?-stats(?:\s+(.*))?$/ matches:
  │     parseStatsArgs(captured)
  │     stats = await runStats(ctx, args)        // reads ctx.sessionManager.getSessionFile()
  │     ctx.ui.notify(stats, "info")
  │     return { action: "handled" }              // bypasses model
  └─► continue
```

Matches upstream's `decision: "block"` semantics — stats render without consuming model tokens.

### 5.4 Subagent dispatch

```
main agent calls `agent` tool with { agent: "cavecrew-investigator", task: "..." }
  ├─► pi-agents resolves config built from vendor/caveman/agents/cavecrew-investigator.md
  ├─► spawns sub-session:
  │     • system prompt = agent .md body (caveman-ultra rules baked in)
  │     • tools = TOOL_MAP applied to frontmatter list
  │       (Read→read, Grep→grep, Glob→glob, Bash→bash, Edit→edit, Write→write)
  │     • model = frontmatter.model (haiku for investigator+reviewer; inherits if absent)
  │     • skills = [vendor/caveman/skills/caveman/SKILL.md] (min-1 fallback)
  ├─► sub-session runs, emits caveman-ultra output
  └─► returns compressed text to main thread as tool result
```

The compression win is real: the sub-session runs caveman-ultra so the tool result returned to the main thread is ~60% smaller than a vanilla `Explore` would emit. Main-context tokens are saved.

### 5.5 Compaction recovery

```
session_compact
  └─► same handler as before_agent_start, but injects unconditionally
      (no prompt to scan — just re-anchor the ruleset)
```

This catches the case where compaction prunes the system-prompt addendum.

## 6. Component contracts

### 6.1 `bootstrap/ruleset.ts` (pure)

```ts
export function buildRuleset(skillMd: string, mode: ModeLabel): string;
```

Takes the raw `vendor/caveman/skills/caveman/SKILL.md`, strips the YAML frontmatter, keeps the intensity table header + the row matching `mode`, keeps example lines starting with `- ${mode}:`. Pure function — snapshot-tested per mode.

### 6.2 `bootstrap/activations.ts` (pure)

```ts
export type ModeChange = { mode: ModeLabel };
export function detectModeChange(prompt: string): ModeChange | null;
```

Regex matrix mirrors upstream `caveman-mode-tracker.js` exactly:
- `/caveman` (bare) → default mode
- `/caveman <arg>` → `arg` if valid, else null
- `/caveman:caveman <arg>` → same
- `/caveman-commit` → `commit`
- `/caveman-review` → `review`
- `/caveman-compress` / `/caveman:caveman-compress` → `compress`
- `\b(activate|enable|turn on|start|talk like)\b.*\bcaveman\b` (without stop verbs) → default mode
- `\bcaveman\b.*\b(mode|activate|enable|turn on|start)\b` (without stop verbs) → default mode
- `\b(stop|disable|turn off|deactivate)\b.*\bcaveman\b` → `off`

### 6.3 `config/flag.ts` (IO boundary, security-critical)

`safeWriteFlag(flagPath, content)` is a 1:1 port of upstream `caveman-config.js`:
- `mkdirSync(flagDir, { recursive: true })`
- if `flagDir` is a symlink, `realpathSync` it, `statSync` the target, refuse if not a directory or `uid !== process.getuid()` (Unix). On Windows, refuse if the resolved path is outside `os.homedir()`.
- write to `${flagPath}.tmp.${pid}` with `O_NOFOLLOW` and mode `0o600`
- `renameSync` to final path
- silent-fail on any filesystem error
- emit stderr diagnostics only when `CAVEMAN_DEBUG=1`

### 6.4 `subagents/build-configs.ts`

```ts
export function buildAgentConfig(file: AgentFile, ctx: BuildCtx): PiAgentConfig;
```

Maps the Claude Code agent `.md` frontmatter to a pi-agents `AgentConfig`:
- `tools`: applied through `TOOL_MAP`, defaults to `PI_DEFAULT_TOOLS` if frontmatter omits
- `model`: passed through ("haiku", "sonnet", "opus", "inherit", or undefined)
- `skills`: pi-agents requires min 1 — fallback to `vendor/caveman/skills/caveman/SKILL.md` when none declared
- `color: "#a87856"`, `icon: "🪨"` (caveman branding)
- `systemPrompt`: agent .md body verbatim

### 6.5 `stats/extract-usage.ts` (pure)

```ts
export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number };
export function extractUsage(entry: unknown): Usage | null;
```

Adapter for pi's jsonl shape: `{type:"message", message:{usage:{input, output, cacheRead, cacheWrite, totalTokens, cost:{...}}}}`. Returns null for non-message entries. Defaults missing fields to 0. Single source of truth for jsonl-schema knowledge — if pi changes its session format, this is the only file to update.

### 6.6 `commands/init.ts`

Spawns `node ${vendorRoot()}/tools/caveman-init.js {{args}}` in `ctx.cwd` via `child_process.spawn`. Streams stdout to `ctx.ui.notify`. Implements the upstream behavior of running `--dry-run` first when `--force` is absent.

## 7. Coexistence with `pi-superpowers`

Pi runs `before_agent_start` handlers in registration order and chains `event.systemPrompt` through them. If both extensions are installed, superpowers' addendum lands first, caveman's ruleset lands second. Concatenation is safe — superpowers tells the model *what skills exist*, caveman tells it *how to speak*. Documented in README.

## 8. Code style (locked, mirrors `pi-agents/AGENTS.md`)

- ESM-only, `.js` extension on relative imports, `verbatimModuleSyntax`
- No classes — factory functions + closures
- Typebox schemas (not zod) for `ModeLabel`, frontmatter, jsonl entries; runtime checks via `safeParse` at IO boundaries
- No `any`, no `!`, no nested ternary, max 2 params per function
- No `let` in `src/` outside IO boundary
- No string-literal `+` concatenation; no `.join` of literal arrays — use `flatten()` template-literal helper
- Files <200 LOC; split when over
- Co-located `*.test.ts` for every prod file
- E2E suffix `*-e2e.test.ts`, gated on `PI_BIN`
- Conventional commits, no AI attribution, no `Co-Authored-By` trailers
- Peer deps `"*"` for pi core packages — never pinned

## 9. Testing strategy

### 9.1 Unit (vitest, no `PI_BIN` required)

| File | What it tests |
|---|---|
| `default-mode.test.ts` | env > config-file > fallback (6 cases incl. invalid env) |
| `flag.test.ts` | atomic write, symlink-dir resolution, uid mismatch, missing dir, Windows home-prefix path |
| `ruleset.test.ts` | snapshot per mode (`lite`, `full`, `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra`) |
| `activations.test.ts` | full regex matrix from §6.2 |
| `on-before-agent-start.test.ts` | mode-change side effects, INDEPENDENT_MODES short prompt, normal-mode full ruleset, off-mode no injection |
| `on-input.test.ts` | stats short-circuit, source:"extension" passthrough, non-stats passthrough |
| `commands/{caveman,commit,review,init,stats,help}.test.ts` | handler dispatch, mock `ctx.ui`, mock `ctx.sendUserMessage`, mock shell-out |
| `subagents/{loader,build-configs,tool-mapping}.test.ts` | fixtures → expected configs, full Claude Code → pi tool map |
| `stats/{extract-usage,parse,render}.test.ts` | fixture jsonl → totals → card |

### 9.2 E2E (`PI_BIN=$(which pi) npm run test:e2e`)

| File | Scenario |
|---|---|
| `e2e/activation-e2e.test.ts` | `pi -e ./src/index.ts -p "explain async/await"` → assert no "Sure!", no "I'd be happy" |
| `e2e/mode-switch-e2e.test.ts` | `/caveman ultra` then prompt → assert ultra-shaped fragments |
| `e2e/stats-e2e.test.ts` | `/caveman-stats` → numeric output, no model round-trip |
| `e2e/cavecrew-e2e.test.ts` | `agent` tool with `cavecrew-investigator` → assert `<path:line>` table format |

### 9.3 Parity check (`scripts/parity-check.ts`)

- `vendor/caveman/commands/*.toml` names must equal the set of registered command names — fail if upstream adds a command we don't handle
- `vendor/caveman/skills/*/SKILL.md` set is logged on diff against last-known list (auto-load handles new ones; we just want a heads-up)
- `vendor/caveman/agents/*.md` set must equal registered agent configs — fail if missing

## 10. Sync workflow

```
./scripts/sync-upstream.sh <upstream-tag>
  rsyncs upstream skills/, agents/, commands/, tools/, LICENSE → vendor/caveman/
  NEVER copies hooks/, .claude-plugin/, install scripts (pi owns activation)
npm run parity-check
npm run check
PI_BIN=$(which pi) npm run test:e2e
git commit -m "chore: sync caveman to <tag>"
git tag <tag> && git push --follow-tags
```

Zero merge conflicts: `src/` never edits `vendor/caveman/`. Generic loaders pick up new skills/agents/commands automatically — parity-check flags additions for review.

## 11. Install

```bash
pi install git:github.com/josorio7122/pi-caveman@v0.1.0
# or, dev mode:
pi -e /path/to/pi-caveman/src/index.ts
```

`pi-agents` is bundled as a regular dep — no separate install needed.

## 12. Open questions (resolved before implementation)

All API and schema questions resolved against pi source + docs + a real pi `.jsonl` session. Nothing left to spike.

| Question | Resolution |
|---|---|
| `before_agent_start` injection API | `return { systemPrompt: event.systemPrompt + addendum }` — chains across extensions |
| `input` event short-circuit | `return { action: "handled" }` after `ctx.ui.notify(...)` |
| Pi jsonl usage shape | `{input, output, cacheRead, cacheWrite, totalTokens, cost:{...}}` — adapter in `extract-usage.ts` |
| pi-agents tool-name canonical | lowercase: `read, bash, edit, write, grep, glob` |
| `AgentConfig.skills` minimum | min 1 — fallback to `vendor/caveman/skills/caveman/SKILL.md` |
| `registerCommand` signature | `(name, { description, handler: (args, ctx) => Promise<void> })` |
| Status update API | `ctx.ui.setStatus(extId, text)` for footer; `setWidget(extId, lines)` for above-editor |
| Re-injection cadence | every turn (matches upstream Claude Code) — explicit user choice |
| Flag file path | `~/.claude/.caveman-active` honoring `CLAUDE_CONFIG_DIR` — cross-tool consistency with Claude Code |
| Coexistence with pi-superpowers | safe; addenda concatenate via chained `event.systemPrompt` |

## 13. Out of scope for v0.1.0

- Native pi theme port (caveman has none upstream)
- Adapting the `compress` skill's bundled Python tooling — ships as-is, user shells out
- Custom TUI widgets beyond status/footer
- Per-project caveman config files (only global config supported, mirroring upstream)

## 14. Release plan

Single milestone — v0.1.0 ships full upstream parity including subagents. No phasing. Subsequent versions track upstream caveman releases via the sync workflow in §10.
