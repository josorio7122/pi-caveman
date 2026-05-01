# pi-caveman v0.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship full caveman feature parity to pi-coding-agent as a thin pi extension package, including skills, slash commands, cavecrew subagents, statusline, stats, and natural-language activation — without editing upstream caveman source.

**Architecture:** Vendor-then-glue. Upstream caveman lives untouched at `vendor/caveman/`. A pi extension under `src/` translates Claude Code surfaces (`SessionStart`/`UserPromptSubmit` hooks, `.toml` slash commands, `.md` subagents) to pi equivalents (`session_start`/`before_agent_start` events, `pi.registerCommand`, pi-agents `createAgentTool`). Pure functions for ruleset filtering, mode detection, jsonl stats parsing, and tool-name mapping; IO confined to bootstrap event handlers and command handlers.

**Tech Stack:** TypeScript 6.x ESM, Node 20+, vitest, biome, Typebox, gray-matter (frontmatter), @iarna/toml (slash command files), pi-agents (subagent runtime), @mariozechner/pi-coding-agent peer dep, @mariozechner/pi-tui peer dep.

**Spec:** `docs/superpowers/specs/2026-05-01-pi-caveman-design.md`

**Reference patterns to mirror:**
- `pi-superpowers` for vendor layout, loader patterns, command handlers, agent config build
- `pi-agents` for AGENTS.md style rules (no classes, no `let`, Typebox, `flatten()`)
- `pi-tasks` for biome.json + check-blank-lines.sh
- Upstream `caveman/hooks/caveman-config.js` for `safeWriteFlag` security logic
- Upstream `caveman/hooks/caveman-mode-tracker.js` for mode-detection regex matrix

**Repo paths cited throughout:**
- Pi docs: `/Users/josorio/.nvm/versions/node/v24.15.0/lib/node_modules/@mariozechner/pi-coding-agent/docs/`
- pi-superpowers reference: `/Users/josorio/Code/pi-superpowers/`
- pi-agents reference: `/Users/josorio/Code/pi-agents/`
- Upstream caveman clone: `/tmp/caveman-clone/` (already cloned; `git -C /tmp/caveman-clone pull` to refresh)

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | pi manifest, peer deps `"*"`, scripts, deps |
| `tsconfig.json` | strict TS, ESM, `verbatimModuleSyntax` |
| `biome.json` | mirrors pi-agents lint rules |
| `vitest.config.ts` | unit test config |
| `vitest.e2e.config.ts` | E2E test config, gated on `PI_BIN` |
| `.gitignore` | node_modules, dist, .pi |
| `LICENSE` | MIT |
| `README.md` | install + usage |
| `AGENTS.md` | strict rules ported from pi-agents |
| `CHANGELOG.md` | release notes |
| `src/index.ts` | async-factory extension entrypoint, wires everything |
| `src/api.ts` | only barrel (biome-ignored) |
| `src/common/strings.ts` | `flatten()` template-literal helper |
| `src/common/fs.ts` | `fileExists()` |
| `src/common/paths.ts` | `vendorRoot()`, `claudeFlagPath()`, `agentsDir()`, `skillsDir()` |
| `src/config/modes.ts` | `VALID_MODES`, `INDEPENDENT_MODES`, `modeLabel()`, Typebox `ModeSchema` |
| `src/config/default-mode.ts` | env > config-file > "full" |
| `src/config/flag.ts` | `safeWriteFlag()`, `readFlag()` (symlink-safe atomic write) |
| `src/bootstrap/ruleset.ts` | pure: read SKILL.md, filter intensity per mode |
| `src/bootstrap/activations.ts` | pure: detect `/caveman*` + NL phrases → mode change |
| `src/bootstrap/on-session-start.ts` | event handler: write flag, set status |
| `src/bootstrap/on-before-agent-start.ts` | event handler: scan prompt, flip mode, append ruleset |
| `src/bootstrap/on-input.ts` | event handler: short-circuit `/caveman-stats` |
| `src/bootstrap/on-session-compact.ts` | event handler: re-anchor ruleset post-compact |
| `src/stats/extract-usage.ts` | pure: jsonl entry → `Usage \| null` |
| `src/stats/parse.ts` | pure: jsonl text → totals |
| `src/stats/render.ts` | pure: totals → caveman-style card |
| `src/ui/status.ts` | `formatStatus(mode)`, status extension id constant |
| `src/subagents/tool-mapping.ts` | `TOOL_MAP` Claude Code → pi tool names |
| `src/subagents/loader.ts` | scan `vendor/caveman/agents/*.md` |
| `src/subagents/build-configs.ts` | frontmatter+body → pi-agents `AgentConfig` |
| `src/subagents/register.ts` | session_start handler: build configs, register tool |
| `src/commands/help.ts` | `/caveman-help` |
| `src/commands/caveman.ts` | `/caveman [arg]` |
| `src/commands/commit.ts` | `/caveman-commit` |
| `src/commands/review.ts` | `/caveman-review` |
| `src/commands/init.ts` | `/caveman-init` |
| `src/commands/stats.ts` | `/caveman-stats` |
| `src/commands/register.ts` | wires all 6 commands |
| `vendor/caveman/` | rsync'd from upstream — never edited |
| `scripts/sync-upstream.sh` | rsync upstream tag → `vendor/caveman/` |
| `scripts/parity-check.ts` | fail if upstream adds unhandled surface |
| `scripts/check-blank-lines.sh` | enforce blank-line rule (port from pi-tasks) |
| `tests/e2e/activation-e2e.test.ts` | E2E: bare prompt → no "Sure!" |
| `tests/e2e/mode-switch-e2e.test.ts` | E2E: `/caveman ultra` → ultra fragments |
| `tests/e2e/stats-e2e.test.ts` | E2E: `/caveman-stats` → numeric output |
| `tests/e2e/cavecrew-e2e.test.ts` | E2E: agent dispatch → caveman-shaped output |

---

## Task 1: Initialize package skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `vitest.config.ts`
- Create: `vitest.e2e.config.ts`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "pi-caveman",
  "version": "0.1.0",
  "description": "caveman ultra-compressed mode for pi — skills, commands, cavecrew subagents",
  "keywords": ["pi-package", "caveman", "tokens", "compression"],
  "license": "MIT",
  "author": "josorio7122",
  "repository": "github:josorio7122/pi-caveman",
  "type": "module",
  "files": ["src", "vendor", "CHANGELOG.md", "LICENSE", "README.md"],
  "engines": {"node": ">=20"},
  "pi": {
    "extensions": ["./src/index.ts"],
    "skills": ["./vendor/caveman/skills"]
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "PI_E2E=1 vitest run --config vitest.e2e.config.ts",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src/ scripts/",
    "lint:fix": "biome check --fix src/ scripts/",
    "format": "biome format --write src/ scripts/",
    "lint:blanks": "bash scripts/check-blank-lines.sh",
    "parity-check": "tsx scripts/parity-check.ts",
    "sync-upstream": "bash scripts/sync-upstream.sh",
    "check": "npm run lint && npm run lint:blanks && npm run typecheck && npm run test && npm run parity-check"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@sinclair/typebox": "*"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "@iarna/toml": "^2.2.5",
    "pi-agents": "github:josorio7122/pi-agents"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.13",
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "vendor", "dist"]
}
```

- [ ] **Step 3: Write `biome.json` mirroring pi-agents**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.14/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": false,
    "includes": ["src/**", "scripts/**", "tests/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "recommended": false,
        "noNestedTernary": "error",
        "noNonNullAssertion": "error",
        "useImportType": "error",
        "useFilenamingConvention": {
          "level": "error",
          "options": { "filenameCases": ["kebab-case"] }
        }
      },
      "performance": {
        "noBarrelFile": "error",
        "noNamespaceImport": "error"
      },
      "complexity": {
        "useMaxParams": {
          "level": "error",
          "options": { "max": 2 }
        },
        "noExcessiveCognitiveComplexity": {
          "level": "error",
          "options": { "maxAllowedComplexity": 25 }
        }
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noControlCharactersInRegex": "off",
        "noEmptyInterface": "off"
      }
    }
  },
  "overrides": [
    {
      "includes": ["src/api.ts"],
      "linter": {
        "rules": {
          "performance": { "noBarrelFile": "off" }
        }
      }
    },
    {
      "includes": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "style": { "noNonNullAssertion": "off" },
          "suspicious": { "noExplicitAny": "error" },
          "correctness": { "noUnusedVariables": "off" }
        }
      }
    }
  ]
}
```

Rule categories: `performance` for `noBarrelFile`/`noNamespaceImport`; `complexity` for `useMaxParams`/`noExcessiveCognitiveComplexity`; `style` for `noNestedTernary`/`noNonNullAssertion`/`useImportType`/`useFilenamingConvention`. The biome 2.4.x schema rejects misplaced keys.

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: ["**/*-e2e.test.ts", "node_modules", "vendor"],
    globals: true,
    passWithNoTests: true,
  },
});
```

- [ ] **Step 5: Write `vitest.e2e.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*-e2e.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 30_000,
    globals: true,
  },
});
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.pi/
*.log
.DS_Store
coverage/
```

- [ ] **Step 7: Write `LICENSE` (MIT)**

Use the standard MIT license text with `Copyright (c) 2026 josorio7122` as the holder line.

- [ ] **Step 8: Write `README.md` stub**

```markdown
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
```

- [ ] **Step 9: Write `AGENTS.md` (port pi-agents rules)**

Copy `/Users/josorio/Code/pi-agents/AGENTS.md` verbatim, replacing the package name in the heading from "pi-agents" to "pi-caveman" and removing pi-agents-specific examples (e.g., `runAgent`). Keep all rules: no classes, no `let` in `src/`, no `any`, no `!`, no nested ternary, max 2 params, blank-line rule, file size <200 LOC, ESM with `.js` extensions, peer deps `"*"`, conventional commits, no AI attribution.

- [ ] **Step 10: Write `CHANGELOG.md` stub**

```markdown
# Changelog

## v0.1.0 — Unreleased

- Initial release. Full upstream caveman parity for pi.
```

- [ ] **Step 11: Install deps**

Run: `npm install`
Expected: `node_modules/` populated, no errors.

- [ ] **Step 12: Verify typecheck passes on empty source**

Create empty `src/index.ts` placeholder:
```ts
export {};
```
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add package.json tsconfig.json biome.json vitest.config.ts vitest.e2e.config.ts .gitignore LICENSE README.md AGENTS.md CHANGELOG.md src/index.ts
git commit -m "chore: initialize pi-caveman package skeleton"
```

---

## Task 2: Sync upstream caveman vendor

**Files:**
- Create: `scripts/sync-upstream.sh`
- Create: `vendor/caveman/` (populated by script)

- [ ] **Step 1: Write `scripts/sync-upstream.sh`**

```bash
#!/usr/bin/env bash
# Sync a tagged release of upstream caveman into vendor/caveman/.
# Never copies hooks/, .claude-plugin/, or install scripts — pi owns activation.

set -euo pipefail

TAG="${1:-main}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/vendor/caveman"

echo "Cloning caveman@$TAG to $TMPDIR..."
git clone --depth=1 --branch "$TAG" https://github.com/juliusbrussee/caveman "$TMPDIR/caveman" 2>&1 | tail -3

echo "Refreshing $VENDOR_DIR..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"

# Copy only the surfaces we wrap. NEVER copy hooks/ or .claude-plugin/.
for sub in skills agents commands tools LICENSE; do
  if [ -e "$TMPDIR/caveman/$sub" ]; then
    cp -R "$TMPDIR/caveman/$sub" "$VENDOR_DIR/"
  fi
done

echo "Synced upstream tag: $TAG"
ls -la "$VENDOR_DIR"
```

- [ ] **Step 2: Make executable**

Run: `chmod +x scripts/sync-upstream.sh`
Expected: no output.

- [ ] **Step 3: Run sync against latest tag**

Run: `bash scripts/sync-upstream.sh main`
Expected: `vendor/caveman/{skills,agents,commands,tools,LICENSE}` populated.

- [ ] **Step 4: Verify vendor structure**

Run: `ls vendor/caveman/skills vendor/caveman/agents vendor/caveman/commands`
Expected:
- skills: `caveman cavecrew caveman-commit caveman-help caveman-review caveman-stats compress`
- agents: `cavecrew-builder.md cavecrew-investigator.md cavecrew-reviewer.md`
- commands: `caveman-commit.toml caveman-init.toml caveman-review.toml caveman.toml`

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-upstream.sh vendor/caveman
git commit -m "chore: sync upstream caveman to vendor/"
```

---

## Task 3: `common/strings.ts` — `flatten()` helper

**Files:**
- Create: `src/common/strings.ts`
- Test: `src/common/strings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { flatten } from "./strings.js";

describe("flatten", () => {
  it("collapses whitespace and trims", () => {
    expect(flatten(`  hello   world  `)).toBe("hello world");
  });

  it("collapses newlines", () => {
    expect(flatten(`hello\n\nworld`)).toBe("hello world");
  });

  it("returns empty string unchanged", () => {
    expect(flatten("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/common/strings.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
export function flatten(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/common/strings.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/common/strings.ts src/common/strings.test.ts
git commit -m "feat: add flatten() string helper"
```

---

## Task 4: `common/fs.ts` — `fileExists()`

**Files:**
- Create: `src/common/fs.ts`
- Test: `src/common/fs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileExists } from "./fs.js";

describe("fileExists", () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await mkdtemp(join(tmpdir(), "pi-caveman-fs-"));
    await writeFile(join(tmp, "exists.txt"), "x");
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("returns true for an existing file", async () => {
    expect(await fileExists(join(tmp, "exists.txt"))).toBe(true);
  });

  it("returns true for an existing directory", async () => {
    expect(await fileExists(tmp)).toBe(true);
  });

  it("returns false for a missing path", async () => {
    expect(await fileExists(join(tmp, "missing.txt"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/common/fs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { stat } from "node:fs/promises";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/common/fs.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/common/fs.ts src/common/fs.test.ts
git commit -m "feat: add fileExists() helper"
```

---

## Task 5: `common/paths.ts` — vendor + flag paths

**Files:**
- Create: `src/common/paths.ts`
- Test: `src/common/paths.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { agentsDir, claudeFlagPath, packageRoot, skillsDir, vendorRoot } from "./paths.js";

describe("paths", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => { Object.assign(process.env, originalEnv); });
  afterEach(() => { for (const k of Object.keys(process.env)) delete process.env[k]; Object.assign(process.env, originalEnv); });

  it("packageRoot resolves to repo root containing package.json", () => {
    const root = packageRoot();
    expect(root).toMatch(/pi-caveman$/);
  });

  it("vendorRoot is packageRoot/vendor/caveman", () => {
    expect(vendorRoot()).toBe(`${packageRoot()}/vendor/caveman`);
  });

  it("skillsDir is vendorRoot/skills", () => {
    expect(skillsDir()).toBe(`${vendorRoot()}/skills`);
  });

  it("agentsDir is vendorRoot/agents", () => {
    expect(agentsDir()).toBe(`${vendorRoot()}/agents`);
  });

  it("claudeFlagPath defaults to ~/.claude/.caveman-active", () => {
    delete process.env.CLAUDE_CONFIG_DIR;
    expect(claudeFlagPath()).toBe(`${homedir()}/.claude/.caveman-active`);
  });

  it("claudeFlagPath honors CLAUDE_CONFIG_DIR", () => {
    process.env.CLAUDE_CONFIG_DIR = "/tmp/fake-claude";
    expect(claudeFlagPath()).toBe("/tmp/fake-claude/.caveman-active");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/common/paths.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function packageRoot(): string {
  // src/common/paths.ts → ../../
  return join(here, "..", "..");
}

export function vendorRoot(): string {
  return join(packageRoot(), "vendor", "caveman");
}

export function skillsDir(): string {
  return join(vendorRoot(), "skills");
}

export function agentsDir(): string {
  return join(vendorRoot(), "agents");
}

export function commandsDir(): string {
  return join(vendorRoot(), "commands");
}

export function toolsDir(): string {
  return join(vendorRoot(), "tools");
}

export function claudeFlagPath(): string {
  const dir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");
  return join(dir, ".caveman-active");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/common/paths.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/common/paths.ts src/common/paths.test.ts
git commit -m "feat: add path resolvers for vendor and flag file"
```

---

## Task 6: `config/modes.ts` — mode constants and Typebox schema

**Files:**
- Create: `src/config/modes.ts`
- Test: `src/config/modes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import {
  INDEPENDENT_MODES,
  isValidMode,
  ModeSchema,
  modeLabel,
  VALID_MODES,
} from "./modes.js";

describe("modes", () => {
  it("VALID_MODES contains all 11 modes", () => {
    expect(VALID_MODES).toEqual([
      "off", "lite", "full", "ultra",
      "wenyan-lite", "wenyan", "wenyan-full", "wenyan-ultra",
      "commit", "review", "compress",
    ]);
  });

  it("INDEPENDENT_MODES has commit/review/compress", () => {
    expect([...INDEPENDENT_MODES].sort()).toEqual(["commit", "compress", "review"]);
  });

  it("isValidMode accepts valid modes", () => {
    expect(isValidMode("ultra")).toBe(true);
    expect(isValidMode("wenyan-full")).toBe(true);
  });

  it("isValidMode rejects invalid", () => {
    expect(isValidMode("foo")).toBe(false);
    expect(isValidMode("")).toBe(false);
  });

  it("isValidMode is case-insensitive", () => {
    expect(isValidMode("ULTRA")).toBe(true);
  });

  it("modeLabel maps wenyan to wenyan-full", () => {
    expect(modeLabel("wenyan")).toBe("wenyan-full");
  });

  it("modeLabel passes through other modes", () => {
    expect(modeLabel("ultra")).toBe("ultra");
    expect(modeLabel("wenyan-lite")).toBe("wenyan-lite");
  });

  it("ModeSchema validates known mode", () => {
    expect(Value.Check(ModeSchema, "full")).toBe(true);
    expect(Value.Check(ModeSchema, "bogus")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/modes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { Type, type Static } from "@sinclair/typebox";

export const VALID_MODES = [
  "off", "lite", "full", "ultra",
  "wenyan-lite", "wenyan", "wenyan-full", "wenyan-ultra",
  "commit", "review", "compress",
] as const;

export type Mode = (typeof VALID_MODES)[number];
export type ModeLabel = Exclude<Mode, "wenyan">;

export const ModeSchema = Type.Union(VALID_MODES.map((m) => Type.Literal(m)));
export type ModeT = Static<typeof ModeSchema>;

export const INDEPENDENT_MODES: ReadonlySet<Mode> = new Set(["commit", "review", "compress"]);

export function isValidMode(value: string): value is Mode {
  return (VALID_MODES as readonly string[]).includes(value.toLowerCase());
}

export function modeLabel(mode: Mode): ModeLabel {
  return mode === "wenyan" ? "wenyan-full" : mode;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/modes.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/modes.ts src/config/modes.test.ts
git commit -m "feat: add mode constants and Typebox schema"
```

---

## Task 7: `config/default-mode.ts` — env / config-file / fallback

**Files:**
- Create: `src/config/default-mode.ts`
- Test: `src/config/default-mode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDefaultMode } from "./default-mode.js";

describe("getDefaultMode", () => {
  let tmp: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), "pi-caveman-mode-"));
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, originalEnv);
    delete process.env.CAVEMAN_DEFAULT_MODE;
    delete process.env.XDG_CONFIG_HOME;
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("returns full when nothing is set", () => {
    process.env.XDG_CONFIG_HOME = tmp;
    expect(getDefaultMode()).toBe("full");
  });

  it("returns env var when set and valid", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    expect(getDefaultMode()).toBe("ultra");
  });

  it("ignores invalid env var, falls through", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "bogus";
    process.env.XDG_CONFIG_HOME = tmp;
    expect(getDefaultMode()).toBe("full");
  });

  it("env var is case-insensitive", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "WENYAN";
    expect(getDefaultMode()).toBe("wenyan");
  });

  it("reads config file under XDG_CONFIG_HOME", async () => {
    process.env.XDG_CONFIG_HOME = tmp;
    await mkdir(join(tmp, "caveman"), { recursive: true });
    await writeFile(join(tmp, "caveman", "config.json"), JSON.stringify({ defaultMode: "lite" }));
    expect(getDefaultMode()).toBe("lite");
  });

  it("env var beats config file", async () => {
    process.env.XDG_CONFIG_HOME = tmp;
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    await mkdir(join(tmp, "caveman"), { recursive: true });
    await writeFile(join(tmp, "caveman", "config.json"), JSON.stringify({ defaultMode: "lite" }));
    expect(getDefaultMode()).toBe("ultra");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/default-mode.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isValidMode, type Mode } from "./modes.js";

function getConfigDir(): string {
  if (process.env.XDG_CONFIG_HOME) return join(process.env.XDG_CONFIG_HOME, "caveman");
  if (process.platform === "win32") {
    const appdata = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appdata, "caveman");
  }
  return join(homedir(), ".config", "caveman");
}

function readConfigMode(): Mode | null {
  try {
    const raw = readFileSync(join(getConfigDir(), "config.json"), "utf8");
    const parsed = JSON.parse(raw) as { defaultMode?: unknown };
    if (typeof parsed.defaultMode !== "string") return null;
    const lc = parsed.defaultMode.toLowerCase();
    return isValidMode(lc) ? (lc as Mode) : null;
  } catch {
    return null;
  }
}

export function getDefaultMode(): Mode {
  const env = process.env.CAVEMAN_DEFAULT_MODE;
  if (env) {
    const lc = env.toLowerCase();
    if (isValidMode(lc)) return lc as Mode;
  }
  const fromConfig = readConfigMode();
  if (fromConfig) return fromConfig;
  return "full";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/default-mode.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/default-mode.ts src/config/default-mode.test.ts
git commit -m "feat: resolve default mode from env > config > full"
```

---

## Task 8: `config/flag.ts` — symlink-safe atomic flag write

Includes upstream's full symlink-safe defense on both read and write paths (lstatSync refusal, O_NOFOLLOW, O_EXCL on write, MAX_FLAG_BYTES=64 cap, VALID_MODES whitelist on read).

**Files:**
- Create: `src/config/flag.ts`
- Test: `src/config/flag.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { lstatSync, readFileSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFlag, safeWriteFlag } from "./flag.js";

describe("flag.ts", () => {
  let tmp: string;

  beforeEach(async () => { tmp = await mkdtemp(join(tmpdir(), "pi-caveman-flag-")); });
  afterEach(async () => { await rm(tmp, { recursive: true, force: true }); });

  it("writes flag content atomically", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "ultra");
    expect(readFileSync(flag, "utf8")).toBe("ultra");
  });

  it("creates parent directory when missing", () => {
    const flag = join(tmp, "nested", "dir", ".caveman-active");
    safeWriteFlag(flag, "lite");
    expect(readFileSync(flag, "utf8")).toBe("lite");
  });

  it("uses 0600 permissions", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "full");
    const mode = statSync(flag).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("readFlag returns null for missing file", () => {
    expect(readFlag(join(tmp, "missing"))).toBeNull();
  });

  it("readFlag returns trimmed content", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "ultra");
    expect(readFlag(flag)).toBe("ultra");
  });

  it("refuses to write when flag itself is a symlink (clobber vector)", () => {
    const flag = join(tmp, ".caveman-active");
    const target = join(tmp, "victim");
    symlinkSync(target, flag);
    safeWriteFlag(flag, "ultra");
    // The symlink should still exist; victim should NOT have been written.
    expect(lstatSync(flag).isSymbolicLink()).toBe(true);
    expect(() => readFileSync(target, "utf8")).toThrow();
    unlinkSync(flag);
  });

  it("readFlag returns null when flag is a symlink", () => {
    const flag = join(tmp, ".caveman-active");
    const target = join(tmp, "victim");
    writeFileSync(target, "ultra");
    symlinkSync(target, flag);
    expect(readFlag(flag)).toBeNull();
    unlinkSync(flag);
  });

  it("readFlag returns null when content exceeds 64 bytes", () => {
    const flag = join(tmp, ".caveman-active");
    writeFileSync(flag, "x".repeat(65));
    expect(readFlag(flag)).toBeNull();
  });

  it("readFlag returns null for invalid mode content", () => {
    const flag = join(tmp, ".caveman-active");
    writeFileSync(flag, "garbage-content");
    expect(readFlag(flag)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/flag.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation (port from upstream `caveman-config.js`)**

```ts
import {
  closeSync,
  constants,
  fchmodSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";
import { isValidMode } from "./modes.js";

const MAX_FLAG_BYTES = 64;

const debug = (msg: string): void => {
  if (process.env.CAVEMAN_DEBUG === "1") process.stderr.write(`[caveman] ${msg}\n`);
};

function verifyDir(flagDir: string): boolean {
  let realFlagDir = flagDir;
  try {
    const lstat = lstatSync(flagDir);
    if (lstat.isSymbolicLink()) {
      realFlagDir = realpathSync(flagDir);
      const realStat = statSync(realFlagDir);
      if (!realStat.isDirectory()) {
        debug(`safeWriteFlag: symlink target ${realFlagDir} is not a directory`);
        return false;
      }
      if (typeof process.getuid === "function") {
        if (realStat.uid !== process.getuid()) {
          debug(`safeWriteFlag: symlink target ${realFlagDir} owned by uid ${realStat.uid}`);
          return false;
        }
      } else {
        const home = homedir();
        const normalizedReal = resolve(realFlagDir).toLowerCase();
        const normalizedHome = resolve(home).toLowerCase();
        if (
          normalizedReal !== normalizedHome &&
          !normalizedReal.startsWith(normalizedHome + sep.toLowerCase())
        ) {
          debug(`safeWriteFlag: symlink target ${normalizedReal} outside home ${normalizedHome}`);
          return false;
        }
      }
    }
  } catch (e) {
    debug(`safeWriteFlag: dir lstat failed: ${(e as Error).message}`);
    return false;
  }
  return true;
}

export function safeWriteFlag(flagPath: string, content: string): void {
  try {
    const flagDir = dirname(flagPath);
    mkdirSync(flagDir, { recursive: true });
    if (!verifyDir(flagDir)) return;

    try {
      const lstat = lstatSync(flagPath);
      if (lstat.isSymbolicLink()) {
        debug(`safeWriteFlag: flag path ${flagPath} is a symlink — refusing`);
        return;
      }
    } catch {
      // missing — fine, will create
    }

    const tmpPath = `${flagPath}.tmp.${process.pid}.${Date.now()}`;
    const flags = constants.O_CREAT | constants.O_WRONLY | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0);
    let fd: number;
    try {
      fd = openSync(tmpPath, flags, 0o600);
    } catch (e) {
      debug(`safeWriteFlag: open tmp failed: ${(e as Error).message}`);
      return;
    }
    try {
      fchmodSync(fd, 0o600);
      writeSync(fd, content);
    } finally {
      closeSync(fd);
    }
    try {
      renameSync(tmpPath, flagPath);
    } catch (e) {
      debug(`safeWriteFlag: rename failed: ${(e as Error).message}`);
      try { unlinkSync(tmpPath); } catch {}
    }
  } catch (e) {
    debug(`safeWriteFlag: outer failed: ${(e as Error).message}`);
  }
}

export function readFlag(flagPath: string): string | null {
  try {
    // Refuse to follow a symlink at the flag path itself.
    const lstat = lstatSync(flagPath);
    if (lstat.isSymbolicLink()) {
      debug(`readFlag: ${flagPath} is a symlink — refusing`);
      return null;
    }
    if (!lstat.isFile()) return null;

    // Bounded read — no arbitrary-size pulls.
    const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0);
    const fd = openSync(flagPath, flags);
    try {
      const buf = Buffer.alloc(MAX_FLAG_BYTES + 1);
      const bytes = readSync(fd, buf, 0, MAX_FLAG_BYTES + 1, 0);
      if (bytes > MAX_FLAG_BYTES) {
        debug(`readFlag: content > ${MAX_FLAG_BYTES} bytes — refusing`);
        return null;
      }
      const content = buf.subarray(0, bytes).toString("utf8").trim();
      if (!isValidMode(content)) {
        debug(`readFlag: '${content}' not a valid mode — refusing`);
        return null;
      }
      return content;
    } finally {
      closeSync(fd);
    }
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/flag.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/flag.ts src/config/flag.test.ts
git commit -m "feat: add symlink-safe atomic flag writer"
```

---

## Task 9: `bootstrap/ruleset.ts` — filter SKILL.md by intensity

**Files:**
- Create: `src/bootstrap/ruleset.ts`
- Test: `src/bootstrap/ruleset.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillsDir } from "../common/paths.js";
import { buildRuleset } from "./ruleset.js";

const skillMd = readFileSync(join(skillsDir(), "caveman", "SKILL.md"), "utf8");

describe("buildRuleset", () => {
  it("strips YAML frontmatter", () => {
    const out = buildRuleset(skillMd, "full");
    expect(out.startsWith("---")).toBe(false);
  });

  it("keeps active level row, drops other intensity rows", () => {
    const out = buildRuleset(skillMd, "full");
    expect(out).toMatch(/\| \*\*full\*\* \|/);
    expect(out).not.toMatch(/\| \*\*ultra\*\* \|/);
    expect(out).not.toMatch(/\| \*\*wenyan-full\*\* \|/);
  });

  it("keeps only active example lines", () => {
    const out = buildRuleset(skillMd, "ultra");
    expect(out).toMatch(/^- ultra:/m);
    expect(out).not.toMatch(/^- full:/m);
    expect(out).not.toMatch(/^- lite:/m);
  });

  it("keeps table header and separator rows regardless of mode", () => {
    const out = buildRuleset(skillMd, "lite");
    expect(out).toMatch(/\| Level \| What change \|/);
    expect(out).toMatch(/\|-+\|-+\|/);
  });

  it("snapshot per mode", () => {
    for (const mode of ["lite", "full", "ultra", "wenyan-lite", "wenyan-full", "wenyan-ultra"] as const) {
      expect(buildRuleset(skillMd, mode)).toMatchSnapshot(mode);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/ruleset.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import type { ModeLabel } from "../config/modes.js";

const FRONTMATTER_RE = /^---[\s\S]*?---\s*/;
const TABLE_ROW_RE = /^\|\s*\*\*(\S+?)\*\*\s*\|/;
const EXAMPLE_RE = /^- (\S+?):\s/;

export function buildRuleset(skillMd: string, mode: ModeLabel): string {
  const body = skillMd.replace(FRONTMATTER_RE, "");
  const lines = body.split("\n");
  const filtered = lines.filter((line) => {
    const tableMatch = TABLE_ROW_RE.exec(line);
    if (tableMatch) return tableMatch[1] === mode;
    const exMatch = EXAMPLE_RE.exec(line);
    if (exMatch) return exMatch[1] === mode;
    return true;
  });
  return filtered.join("\n").trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/ruleset.test.ts -u`
Expected: PASS, 5 tests, 6 snapshots written. After review, run without `-u` and confirm PASS.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/ruleset.ts src/bootstrap/ruleset.test.ts src/bootstrap/__snapshots__
git commit -m "feat: filter caveman SKILL.md by intensity level"
```

---

## Task 10: `bootstrap/activations.ts` — detect mode-change prompts

**Files:**
- Create: `src/bootstrap/activations.ts`
- Test: `src/bootstrap/activations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { detectModeChange } from "./activations.js";

describe("detectModeChange", () => {
  const def = "full";

  it("bare /caveman → default", () => {
    expect(detectModeChange("/caveman", def)).toEqual({ mode: "full" });
  });

  it("/caveman ultra → ultra", () => {
    expect(detectModeChange("/caveman ultra", def)).toEqual({ mode: "ultra" });
  });

  it("/caveman:caveman wenyan → wenyan", () => {
    expect(detectModeChange("/caveman:caveman wenyan", def)).toEqual({ mode: "wenyan" });
  });

  it("/caveman bogus → null (invalid arg)", () => {
    expect(detectModeChange("/caveman bogus", def)).toBeNull();
  });

  it("/caveman-commit → commit", () => {
    expect(detectModeChange("/caveman-commit", def)).toEqual({ mode: "commit" });
  });

  it("/caveman-review → review", () => {
    expect(detectModeChange("/caveman-review", def)).toEqual({ mode: "review" });
  });

  it("/caveman-compress → compress", () => {
    expect(detectModeChange("/caveman-compress", def)).toEqual({ mode: "compress" });
  });

  it("/caveman:caveman-compress → compress", () => {
    expect(detectModeChange("/caveman:caveman-compress some.md", def)).toEqual({ mode: "compress" });
  });

  it("'activate caveman' → default", () => {
    expect(detectModeChange("activate caveman please", def)).toEqual({ mode: "full" });
  });

  it("'talk like caveman' → default", () => {
    expect(detectModeChange("can you talk like caveman?", def)).toEqual({ mode: "full" });
  });

  it("'caveman mode' → default", () => {
    expect(detectModeChange("turn on caveman mode", def)).toEqual({ mode: "full" });
  });

  it("'stop caveman' → off", () => {
    expect(detectModeChange("stop caveman", def)).toEqual({ mode: "off" });
  });

  it("'turn off caveman' → off", () => {
    expect(detectModeChange("please turn off caveman", def)).toEqual({ mode: "off" });
  });

  it("activate verb + caveman + stop verb → off (stop wins)", () => {
    expect(detectModeChange("activate caveman, no wait, stop caveman", def)).toEqual({ mode: "off" });
  });

  it("unrelated text → null", () => {
    expect(detectModeChange("explain async/await", def)).toBeNull();
  });

  it("respects custom default", () => {
    expect(detectModeChange("/caveman", "ultra")).toEqual({ mode: "ultra" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/activations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { isValidMode, type Mode } from "../config/modes.js";

export type ModeChange = { readonly mode: Mode };

const SLASH_RE = /^\/caveman(?::caveman)?(?:[-:](\w+))?(?:\s+(.+))?$/;
const ACTIVATE_RE = /\b(activate|enable|turn\s+on|start|talk\s+like)\b.*\bcaveman\b/i;
const ACTIVATE_TRAILING_RE = /\bcaveman\b.*\b(mode|activate|enable|turn\s+on|start)\b/i;
const STOP_RE = /\b(stop|disable|turn\s+off|deactivate)\b.*\bcaveman\b/i;

const SLASH_ALIASES: Readonly<Record<string, Mode>> = {
  commit: "commit",
  review: "review",
  compress: "compress",
};

function parseSlashArg(arg: string | undefined): Mode | null {
  if (!arg) return null;
  const lc = arg.toLowerCase();
  return isValidMode(lc) ? (lc as Mode) : null;
}

export function detectModeChange(prompt: string, defaultMode: Mode): ModeChange | null {
  const trimmed = prompt.trim();
  const slash = SLASH_RE.exec(trimmed.toLowerCase());

  if (slash) {
    const subcmd = slash[1];
    const arg = slash[2];
    if (subcmd && SLASH_ALIASES[subcmd]) return { mode: SLASH_ALIASES[subcmd] };
    if (subcmd === "stats" || subcmd === "init" || subcmd === "help") return null;
    if (!subcmd) {
      if (!arg) return { mode: defaultMode };
      const parsedArg = parseSlashArg(arg);
      return parsedArg ? { mode: parsedArg } : null;
    }
    return null;
  }

  // Stop verbs win over activate verbs (handled before activate match below).
  if (STOP_RE.test(trimmed)) return { mode: "off" };
  if (ACTIVATE_RE.test(trimmed) || ACTIVATE_TRAILING_RE.test(trimmed)) {
    return { mode: defaultMode };
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/activations.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/activations.ts src/bootstrap/activations.test.ts
git commit -m "feat: detect /caveman commands and natural-language activation"
```

---

## Task 11: `stats/extract-usage.ts` — pi jsonl entry → Usage

**Files:**
- Create: `src/stats/extract-usage.ts`
- Test: `src/stats/extract-usage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { extractUsage } from "./extract-usage.js";

describe("extractUsage", () => {
  it("returns null for non-message entries", () => {
    expect(extractUsage({ type: "session" })).toBeNull();
    expect(extractUsage({ type: "model_change" })).toBeNull();
  });

  it("returns null when message has no usage", () => {
    expect(extractUsage({ type: "message", message: { role: "user", content: [] } })).toBeNull();
  });

  it("extracts pi-shape usage fields", () => {
    const entry = {
      type: "message",
      message: {
        role: "assistant",
        content: [],
        usage: {
          input: 10135,
          output: 352,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 10487,
        },
      },
    };
    expect(extractUsage(entry)).toEqual({ input: 10135, output: 352, cacheRead: 0, cacheWrite: 0 });
  });

  it("defaults missing fields to 0", () => {
    const entry = {
      type: "message",
      message: { role: "assistant", content: [], usage: { input: 50 } },
    };
    expect(extractUsage(entry)).toEqual({ input: 50, output: 0, cacheRead: 0, cacheWrite: 0 });
  });

  it("returns null for non-object entry", () => {
    expect(extractUsage(null)).toBeNull();
    expect(extractUsage("string")).toBeNull();
    expect(extractUsage(42)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stats/extract-usage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
export type Usage = {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
};

type RawUsage = { input?: number; output?: number; cacheRead?: number; cacheWrite?: number };

export function extractUsage(entry: unknown): Usage | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as { type?: unknown; message?: unknown };
  if (e.type !== "message" || typeof e.message !== "object" || e.message === null) return null;
  const m = e.message as { usage?: unknown };
  if (typeof m.usage !== "object" || m.usage === null) return null;
  const u = m.usage as RawUsage;
  return {
    input: u.input ?? 0,
    output: u.output ?? 0,
    cacheRead: u.cacheRead ?? 0,
    cacheWrite: u.cacheWrite ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stats/extract-usage.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/stats/extract-usage.ts src/stats/extract-usage.test.ts
git commit -m "feat: extract usage from pi jsonl entries"
```

---

## Task 12: `stats/parse.ts` — fold jsonl into totals

**Files:**
- Create: `src/stats/parse.ts`
- Test: `src/stats/parse.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { parseSessionTotals } from "./parse.js";

const FIXTURE = [
  JSON.stringify({ type: "session", id: "s1" }),
  JSON.stringify({ type: "message", message: { role: "user", content: [] } }),
  JSON.stringify({
    type: "message",
    message: { role: "assistant", content: [], usage: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 } },
  }),
  JSON.stringify({
    type: "message",
    message: { role: "assistant", content: [], usage: { input: 80, output: 40, cacheRead: 60, cacheWrite: 20 } },
  }),
  "",
  "not-json-line",
].join("\n");

describe("parseSessionTotals", () => {
  it("sums usage fields, ignores non-usage and bad lines", () => {
    expect(parseSessionTotals(FIXTURE)).toEqual({
      input: 180, output: 90, cacheRead: 60, cacheWrite: 20,
      messages: 2,
    });
  });

  it("returns zeros for empty input", () => {
    expect(parseSessionTotals("")).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stats/parse.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { extractUsage, type Usage } from "./extract-usage.js";

export type Totals = Usage & { readonly messages: number };

export function parseSessionTotals(jsonl: string): Totals {
  const lines = jsonl.split("\n");
  return lines.reduce<Totals>(
    (acc, line) => {
      if (!line) return acc;
      try {
        const u = extractUsage(JSON.parse(line));
        if (!u) return acc;
        return {
          input: acc.input + u.input,
          output: acc.output + u.output,
          cacheRead: acc.cacheRead + u.cacheRead,
          cacheWrite: acc.cacheWrite + u.cacheWrite,
          messages: acc.messages + 1,
        };
      } catch {
        return acc;
      }
    },
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stats/parse.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/stats/parse.ts src/stats/parse.test.ts
git commit -m "feat: parse jsonl session into token totals"
```

---

## Task 13: `stats/render.ts` — caveman-style stats card

**Files:**
- Create: `src/stats/render.ts`
- Test: `src/stats/render.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { renderStatsCard } from "./render.js";

describe("renderStatsCard", () => {
  it("renders zero-totals as no-data card", () => {
    const out = renderStatsCard({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 });
    expect(out).toContain("No usage yet");
  });

  it("renders totals as caveman card", () => {
    const out = renderStatsCard({ input: 12000, output: 800, cacheRead: 5000, cacheWrite: 1000, messages: 6 });
    expect(out).toContain("🪨 caveman stats");
    expect(out).toMatch(/messages\s+6/);
    expect(out).toMatch(/input\s+12,000/);
    expect(out).toMatch(/output\s+800/);
    expect(out).toMatch(/cache read\s+5,000/);
    expect(out).toMatch(/cache write\s+1,000/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stats/render.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import type { Totals } from "./parse.js";

const fmt = (n: number): string => n.toLocaleString("en-US");

export function renderStatsCard(t: Totals): string {
  if (t.messages === 0) return "🪨 caveman stats — No usage yet.";
  const lines = [
    "🪨 caveman stats",
    `messages    ${fmt(t.messages)}`,
    `input       ${fmt(t.input)}`,
    `output      ${fmt(t.output)}`,
    `cache read  ${fmt(t.cacheRead)}`,
    `cache write ${fmt(t.cacheWrite)}`,
  ];
  return lines.join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stats/render.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/stats/render.ts src/stats/render.test.ts
git commit -m "feat: render caveman stats card"
```

---

## Task 14: `ui/status.ts` — formatStatus + extension id

**Files:**
- Create: `src/ui/status.ts`
- Test: `src/ui/status.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { CAVEMAN_EXT_ID, formatStatus } from "./status.js";

describe("status", () => {
  it("CAVEMAN_EXT_ID is stable", () => {
    expect(CAVEMAN_EXT_ID).toBe("pi-caveman");
  });

  it("formats active mode", () => {
    expect(formatStatus("ultra")).toBe("🪨 caveman · ultra");
  });

  it("formats off as muted", () => {
    expect(formatStatus("off")).toBe("🪨 caveman · off");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/status.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import type { Mode } from "../config/modes.js";

export const CAVEMAN_EXT_ID = "pi-caveman";

export function formatStatus(mode: Mode): string {
  return `🪨 caveman · ${mode}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/status.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/status.ts src/ui/status.test.ts
git commit -m "feat: status line formatter for caveman footer"
```

---

## Task 15: `subagents/tool-mapping.ts` — Claude Code → pi tool names

**Files:**
- Create: `src/subagents/tool-mapping.ts`
- Test: `src/subagents/tool-mapping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mapTools, TOOL_MAP } from "./tool-mapping.js";

describe("tool-mapping", () => {
  it("maps every Claude Code tool name", () => {
    expect(TOOL_MAP).toEqual({
      Read: "read", Grep: "grep", Glob: "glob",
      Bash: "bash", Edit: "edit", Write: "write",
    });
  });

  it("mapTools converts all known names", () => {
    expect(mapTools(["Read", "Grep", "Glob", "Bash"])).toEqual(["read", "grep", "glob", "bash"]);
  });

  it("mapTools lowercases unknown names rather than dropping", () => {
    expect(mapTools(["Read", "CustomTool"])).toEqual(["read", "customtool"]);
  });

  it("mapTools handles empty input", () => {
    expect(mapTools([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/subagents/tool-mapping.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
export const TOOL_MAP: Readonly<Record<string, string>> = {
  Read: "read",
  Grep: "grep",
  Glob: "glob",
  Bash: "bash",
  Edit: "edit",
  Write: "write",
};

export function mapTools(tools: ReadonlyArray<string>): string[] {
  return tools.map((t) => TOOL_MAP[t] ?? t.toLowerCase());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/subagents/tool-mapping.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/subagents/tool-mapping.ts src/subagents/tool-mapping.test.ts
git commit -m "feat: map Claude Code tool names to pi tool names"
```

---

## Task 16: `subagents/loader.ts` — scan vendor/caveman/agents

**Files:**
- Create: `src/subagents/loader.ts`
- Test: `src/subagents/loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { agentsDir } from "../common/paths.js";
import { loadAgentFiles } from "./loader.js";

describe("loadAgentFiles", () => {
  it("loads three cavecrew agents", async () => {
    const result = await loadAgentFiles(agentsDir());
    const names = result.files.map((f) => f.frontmatter.name).sort();
    expect(names).toEqual(["cavecrew-builder", "cavecrew-investigator", "cavecrew-reviewer"]);
  });

  it("returns body without frontmatter", async () => {
    const result = await loadAgentFiles(agentsDir());
    const inv = result.files.find((f) => f.frontmatter.name === "cavecrew-investigator");
    expect(inv).toBeDefined();
    expect(inv?.body.startsWith("---")).toBe(false);
    expect(inv?.body).toContain("Caveman-ultra");
  });

  it("includes diagnostics list (empty for valid vendor)", async () => {
    const result = await loadAgentFiles(agentsDir());
    expect(result.diagnostics).toEqual([]);
  });

  it("handles missing dir gracefully", async () => {
    const result = await loadAgentFiles("/nonexistent/path");
    expect(result.files).toEqual([]);
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0]?.level).toBe("warn");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/subagents/loader.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

export type AgentFrontmatter = Readonly<{
  name: string;
  description: string;
  model?: string;
  tools?: ReadonlyArray<string>;
}>;

export type AgentFile = Readonly<{
  filePath: string;
  frontmatter: AgentFrontmatter;
  body: string;
}>;

export type LoaderDiagnostic = Readonly<{
  level: "warn" | "error";
  filePath: string;
  message: string;
}>;

export type LoaderResult = Readonly<{
  files: ReadonlyArray<AgentFile>;
  diagnostics: ReadonlyArray<LoaderDiagnostic>;
}>;

function parseFrontmatter(raw: Record<string, unknown>, filePath: string): AgentFrontmatter | null {
  if (typeof raw.name !== "string" || typeof raw.description !== "string") return null;
  const tools = Array.isArray(raw.tools)
    ? raw.tools.filter((t): t is string => typeof t === "string")
    : Array.isArray((raw as { tools?: string }).tools)
      ? undefined
      : undefined;
  return {
    name: raw.name,
    description: raw.description,
    ...(typeof raw.model === "string" ? { model: raw.model } : {}),
    ...(tools ? { tools } : {}),
  };
}

export async function loadAgentFiles(dir: string): Promise<LoaderResult> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return {
      files: [],
      diagnostics: [{ level: "warn", filePath: dir, message: "agents dir missing" }],
    };
  }
  const mds = entries.filter((e) => e.endsWith(".md"));
  const results = await Promise.all(
    mds.map(async (entry): Promise<{ file?: AgentFile; diag?: LoaderDiagnostic }> => {
      const filePath = join(dir, entry);
      try {
        const raw = await readFile(filePath, "utf8");
        const parsed = matter(raw);
        const fm = parseFrontmatter(parsed.data, filePath);
        if (!fm) {
          return { diag: { level: "error", filePath, message: "missing name/description in frontmatter" } };
        }
        // Frontmatter tools may be comma-separated string; split + trim if so.
        const toolsField = (parsed.data as { tools?: unknown }).tools;
        const tools = typeof toolsField === "string"
          ? toolsField.split(",").map((t) => t.trim()).filter(Boolean)
          : fm.tools;
        const fmFinal: AgentFrontmatter = tools ? { ...fm, tools } : fm;
        return { file: { filePath, frontmatter: fmFinal, body: parsed.content.trim() } };
      } catch (e) {
        return { diag: { level: "error", filePath, message: `parse failed: ${(e as Error).message}` } };
      }
    }),
  );
  const files = results.flatMap((r) => (r.file ? [r.file] : []));
  const diagnostics = results.flatMap((r) => (r.diag ? [r.diag] : []));
  return { files, diagnostics };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/subagents/loader.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/subagents/loader.ts src/subagents/loader.test.ts
git commit -m "feat: load cavecrew agent files from vendor"
```

---

## Task 17: `subagents/build-configs.ts` — frontmatter → AgentConfig

**Files:**
- Create: `src/subagents/build-configs.ts`
- Test: `src/subagents/build-configs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillsDir } from "../common/paths.js";
import { buildAgentConfig } from "./build-configs.js";

const baseFile = {
  filePath: "/tmp/agent.md",
  frontmatter: { name: "test-agent", description: "test", tools: ["Read", "Grep"] },
  body: "system prompt body",
};

describe("buildAgentConfig", () => {
  const skills = [{ name: "caveman", path: join(skillsDir(), "caveman", "SKILL.md"), description: "" }];

  it("maps Claude Code tools to pi names", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.tools).toEqual(["read", "grep"]);
  });

  it("falls back to default tools when frontmatter omits", () => {
    const cfg = buildAgentConfig({ ...baseFile, frontmatter: { name: "x", description: "y" } }, { skills });
    expect(cfg.frontmatter.tools).toEqual(["read", "bash", "edit", "write"]);
  });

  it("passes through model when present", () => {
    const cfg = buildAgentConfig(
      { ...baseFile, frontmatter: { ...baseFile.frontmatter, model: "haiku" } },
      { skills },
    );
    expect(cfg.frontmatter.model).toBe("haiku");
  });

  it("omits model when absent", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.model).toBeUndefined();
  });

  it("uses skill paths in frontmatter.skills", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.skills).toEqual([skills[0]?.path]);
  });

  it("uses caveman branding", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.color).toBe("#a87856");
    expect(cfg.frontmatter.icon).toBe("🪨");
  });

  it("body becomes systemPrompt verbatim", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.systemPrompt).toBe("system prompt body");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/subagents/build-configs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import type { AgentFile } from "./loader.js";
import { mapTools } from "./tool-mapping.js";

export type Skill = Readonly<{ name: string; path: string; description: string }>;

export type PiAgentConfig = Readonly<{
  frontmatter: Readonly<{
    name: string;
    description: string;
    model?: string;
    color: string;
    icon: string;
    tools: ReadonlyArray<string>;
    skills: ReadonlyArray<string>;
  }>;
  systemPrompt: string;
  filePath: string;
  source: "user";
}>;

export type BuildCtx = Readonly<{ skills: ReadonlyArray<Skill> }>;

const DEFAULT_PI_TOOLS = ["read", "bash", "edit", "write"] as const;

export function buildAgentConfig(file: AgentFile, ctx: BuildCtx): PiAgentConfig {
  const tools = file.frontmatter.tools && file.frontmatter.tools.length > 0
    ? mapTools(file.frontmatter.tools)
    : [...DEFAULT_PI_TOOLS];

  return {
    frontmatter: {
      name: file.frontmatter.name,
      description: file.frontmatter.description,
      ...(file.frontmatter.model ? { model: file.frontmatter.model } : {}),
      color: "#a87856",
      icon: "🪨",
      tools,
      skills: ctx.skills.map((s) => s.path),
    },
    systemPrompt: file.body,
    filePath: file.filePath,
    source: "user",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/subagents/build-configs.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/subagents/build-configs.ts src/subagents/build-configs.test.ts
git commit -m "feat: build pi-agents AgentConfig from caveman frontmatter"
```

---

## Task 18: `subagents/register.ts` — wire pi-agents `agent` tool

**Files:**
- Create: `src/subagents/register.ts`
- Test: `src/subagents/register.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { registerCavecrew } from "./register.js";

describe("registerCavecrew", () => {
  it("registers a single agent tool with all valid configs", async () => {
    const registerTool = vi.fn();
    const ctx = {
      cwd: "/tmp",
      sessionManager: { getSessionDir: () => "/tmp/sess" },
      modelRegistry: {},
      ui: { notify: vi.fn() },
    };

    const fakeCreate = vi.fn(() => ({ name: "agent" }));
    await registerCavecrew(
      { registerTool } as never,
      ctx as never,
      { createAgentTool: fakeCreate as never },
    );

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(fakeCreate).toHaveBeenCalledOnce();
    const call = fakeCreate.mock.calls[0]?.[0] as { agents: Array<{ frontmatter: { name: string } }> };
    expect(call.agents.map((a) => a.frontmatter.name).sort()).toEqual([
      "cavecrew-builder", "cavecrew-investigator", "cavecrew-reviewer",
    ]);
  });

  it("notifies user on count", async () => {
    const registerTool = vi.fn();
    const notify = vi.fn();
    const ctx = {
      cwd: "/tmp",
      sessionManager: { getSessionDir: () => "/tmp/sess" },
      modelRegistry: {},
      ui: { notify },
    };
    await registerCavecrew(
      { registerTool } as never,
      ctx as never,
      { createAgentTool: vi.fn(() => ({})) as never },
    );
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/cavecrew · 3 agent/), "info");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/subagents/register.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { createAgentTool as defaultCreate } from "pi-agents";
import { agentsDir, skillsDir } from "../common/paths.js";
import { buildAgentConfig, type Skill } from "./build-configs.js";
import { loadAgentFiles } from "./loader.js";

type CreateAgentToolFn = typeof defaultCreate;

type ExtensionAPI = { registerTool: (tool: unknown) => void };
type Ctx = {
  cwd: string;
  sessionManager: { getSessionDir: () => string };
  modelRegistry: unknown;
  ui: { notify: (text: string, level: string) => void };
};

function fallbackSkill(): Skill {
  return {
    name: "caveman",
    path: `${skillsDir()}/caveman/SKILL.md`,
    description: "caveman compression rules",
  };
}

export async function registerCavecrew(
  pi: ExtensionAPI,
  ctx: Ctx,
  deps: { createAgentTool: CreateAgentToolFn } = { createAgentTool: defaultCreate },
): Promise<void> {
  const loaded = await loadAgentFiles(agentsDir());
  if (loaded.files.length === 0) return;

  const skills: ReadonlyArray<Skill> = [fallbackSkill()];
  const agents = loaded.files.map((f) => buildAgentConfig(f, { skills }));

  const tool = deps.createAgentTool({
    agents: agents as never,
    modelRegistry: ctx.modelRegistry as never,
    cwd: ctx.cwd,
    sessionDir: ctx.sessionManager.getSessionDir(),
  });
  pi.registerTool(tool);
  ctx.ui.notify(`🪨 cavecrew · ${agents.length} agent(s) loaded`, "info");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/subagents/register.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/subagents/register.ts src/subagents/register.test.ts
git commit -m "feat: register cavecrew subagents via pi-agents"
```

---

## Task 19: `bootstrap/on-session-start.ts` — write flag, set status

**Files:**
- Create: `src/bootstrap/on-session-start.ts`
- Test: `src/bootstrap/on-session-start.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnSessionStart } from "./on-session-start.js";

describe("on-session-start", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-sess-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
    delete process.env.CAVEMAN_DEFAULT_MODE;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("writes flag and sets status with default mode", async () => {
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("full");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · full");
  });

  it("respects env override", async () => {
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
  });

  it("does not set status when mode is off", async () => {
    process.env.CAVEMAN_DEFAULT_MODE = "off";
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(setStatus).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/on-session-start.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { claudeFlagPath } from "../common/paths.js";
import { getDefaultMode } from "../config/default-mode.js";
import { safeWriteFlag } from "../config/flag.js";
import { CAVEMAN_EXT_ID, formatStatus } from "../ui/status.js";

type Ctx = { ui: { setStatus: (id: string, text: string) => void } };
type Handler = (event: unknown, ctx: Ctx) => Promise<void>;

export function buildOnSessionStart(): Handler {
  return async (_event, ctx) => {
    const mode = getDefaultMode();
    safeWriteFlag(claudeFlagPath(), mode);
    if (mode === "off") return;
    ctx.ui.setStatus(CAVEMAN_EXT_ID, formatStatus(mode));
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/on-session-start.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/on-session-start.ts src/bootstrap/on-session-start.test.ts
git commit -m "feat: write flag and set status on session start"
```

---

## Task 20: `bootstrap/on-before-agent-start.ts` — re-inject ruleset, flip mode

**Files:**
- Create: `src/bootstrap/on-before-agent-start.ts`
- Test: `src/bootstrap/on-before-agent-start.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnBeforeAgentStart } from "./on-before-agent-start.js";

describe("on-before-agent-start", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-bas-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
    delete process.env.CAVEMAN_DEFAULT_MODE;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("appends ruleset to systemPrompt for normal mode", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "explain async/await", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(out.systemPrompt?.startsWith("ORIG\n\n")).toBe(true);
    expect(out.systemPrompt).toContain("**full**");
  });

  it("flips mode on /caveman ultra and writes flag", async () => {
    const setStatus = vi.fn();
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "/caveman ultra", systemPrompt: "ORIG" } as never,
      { ui: { setStatus } } as never,
    );
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
    expect(out.systemPrompt).toContain("**ultra**");
  });

  it("returns empty when mode is off", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "stop caveman", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("off");
    expect(out).toEqual({});
  });

  it("uses short activation line for INDEPENDENT_MODES", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "/caveman-commit", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(out.systemPrompt).toMatch(/CAVEMAN MODE ACTIVE — level: commit\. Behavior defined by \/caveman-commit skill\./);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/on-before-agent-start.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { claudeFlagPath, skillsDir } from "../common/paths.js";
import { getDefaultMode } from "../config/default-mode.js";
import { readFlag, safeWriteFlag } from "../config/flag.js";
import { INDEPENDENT_MODES, isValidMode, type Mode, modeLabel } from "../config/modes.js";
import { CAVEMAN_EXT_ID, formatStatus } from "../ui/status.js";
import { detectModeChange } from "./activations.js";
import { buildRuleset } from "./ruleset.js";

type Event = { prompt?: string; systemPrompt: string };
type Ctx = { ui: { setStatus: (id: string, text: string) => void } };
type Result = { systemPrompt?: string };
type Handler = (event: Event, ctx: Ctx) => Promise<Result>;

let cachedSkillMd: string | null = null;
function getSkillMd(): string {
  if (cachedSkillMd === null) {
    cachedSkillMd = readFileSync(join(skillsDir(), "caveman", "SKILL.md"), "utf8");
  }
  return cachedSkillMd;
}

function resolveMode(prompt: string | undefined, ctx: Ctx): Mode {
  const flagPath = claudeFlagPath();
  const change = prompt ? detectModeChange(prompt, getDefaultMode()) : null;
  if (change) {
    safeWriteFlag(flagPath, change.mode);
    if (change.mode !== "off") {
      ctx.ui.setStatus(CAVEMAN_EXT_ID, formatStatus(change.mode));
    }
    return change.mode;
  }
  const persisted = readFlag(flagPath);
  if (persisted && isValidMode(persisted)) return persisted as Mode;
  return getDefaultMode();
}

export function buildOnBeforeAgentStart(): Handler {
  return async (event, ctx) => {
    const mode = resolveMode(event.prompt, ctx);
    if (mode === "off") return {};
    if (INDEPENDENT_MODES.has(mode)) {
      return {
        systemPrompt: `${event.systemPrompt}\n\nCAVEMAN MODE ACTIVE — level: ${mode}. Behavior defined by /caveman-${mode} skill.`,
      };
    }
    const ruleset = buildRuleset(getSkillMd(), modeLabel(mode));
    return { systemPrompt: `${event.systemPrompt}\n\n${ruleset}` };
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/on-before-agent-start.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/on-before-agent-start.ts src/bootstrap/on-before-agent-start.test.ts
git commit -m "feat: re-inject ruleset and flip mode every turn"
```

---

## Task 21: `bootstrap/on-input.ts` — short-circuit `/caveman-stats`

**Files:**
- Create: `src/bootstrap/on-input.ts`
- Test: `src/bootstrap/on-input.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { buildOnInput } from "./on-input.js";

describe("on-input", () => {
  it("passes through extension-source events", async () => {
    const handler = buildOnInput({ runStats: vi.fn() });
    const out = await handler({ text: "/caveman-stats", source: "extension" } as never, {} as never);
    expect(out).toEqual({ action: "continue" });
  });

  it("handles /caveman-stats by calling runStats and notifying", async () => {
    const runStats = vi.fn().mockResolvedValue("CARD");
    const notify = vi.fn();
    const handler = buildOnInput({ runStats });
    const out = await handler(
      { text: "/caveman-stats", source: "interactive" } as never,
      { ui: { notify } } as never,
    );
    expect(runStats).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("CARD", "info");
    expect(out).toEqual({ action: "handled" });
  });

  it("parses --share / --all / --since flags", async () => {
    const runStats = vi.fn().mockResolvedValue("CARD");
    const handler = buildOnInput({ runStats });
    await handler(
      { text: "/caveman-stats --share --all --since 2026-01-01", source: "interactive" } as never,
      { ui: { notify: vi.fn() } } as never,
    );
    expect(runStats).toHaveBeenCalledWith(expect.anything(), { share: true, all: true, since: "2026-01-01" });
  });

  it("continues for non-stats input", async () => {
    const handler = buildOnInput({ runStats: vi.fn() });
    const out = await handler({ text: "explain async", source: "interactive" } as never, {} as never);
    expect(out).toEqual({ action: "continue" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/on-input.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
type Event = { text: string; source: "interactive" | "rpc" | "extension" };
type Ctx = { ui: { notify: (text: string, level: string) => void } };
type Result = { action: "continue" } | { action: "handled" };
type Handler = (event: Event, ctx: Ctx) => Promise<Result>;

export type StatsArgs = Readonly<{ share: boolean; all: boolean; since?: string }>;
export type RunStatsFn = (ctx: Ctx, args: StatsArgs) => Promise<string>;

const STATS_RE = /^\/caveman(?::caveman)?-stats(?:\s+(.*))?$/;

export function parseStatsArgs(rest: string | undefined): StatsArgs {
  const parts = (rest ?? "").trim().split(/\s+/).filter(Boolean);
  const share = parts.includes("--share");
  const all = parts.includes("--all");
  const sinceIdx = parts.indexOf("--since");
  const since = sinceIdx >= 0 ? parts[sinceIdx + 1] : undefined;
  return since ? { share, all, since } : { share, all };
}

export function buildOnInput(deps: { runStats: RunStatsFn }): Handler {
  return async (event, ctx) => {
    if (event.source === "extension") return { action: "continue" };
    const m = STATS_RE.exec(event.text.trim());
    if (!m) return { action: "continue" };
    const args = parseStatsArgs(m[1]);
    const card = await deps.runStats(ctx, args);
    ctx.ui.notify(card, "info");
    return { action: "handled" };
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/on-input.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/on-input.ts src/bootstrap/on-input.test.ts
git commit -m "feat: short-circuit /caveman-stats input event"
```

---

## Task 22: `bootstrap/on-session-compact.ts` — re-anchor after compact

**Files:**
- Create: `src/bootstrap/on-session-compact.ts`
- Test: `src/bootstrap/on-session-compact.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnSessionCompact } from "./on-session-compact.js";

describe("on-session-compact", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-compact-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("notifies via custom_message when persisted mode is active", async () => {
    writeFileSync(join(tmp, ".caveman-active"), "ultra");
    const appendEntry = vi.fn();
    const handler = buildOnSessionCompact();
    await handler({} as never, { appendEntry } as never);
    expect(appendEntry).toHaveBeenCalled();
    const arg = (appendEntry.mock.calls[0]?.[0] ?? {}) as { content?: string };
    expect(arg.content).toContain("**ultra**");
  });

  it("no-op when mode is off", async () => {
    writeFileSync(join(tmp, ".caveman-active"), "off");
    const appendEntry = vi.fn();
    const handler = buildOnSessionCompact();
    await handler({} as never, { appendEntry } as never);
    expect(appendEntry).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/bootstrap/on-session-compact.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { claudeFlagPath, skillsDir } from "../common/paths.js";
import { getDefaultMode } from "../config/default-mode.js";
import { readFlag } from "../config/flag.js";
import { INDEPENDENT_MODES, isValidMode, type Mode, modeLabel } from "../config/modes.js";
import { buildRuleset } from "./ruleset.js";

type Ctx = { appendEntry: (entry: { customType: string; content: string; display?: boolean }) => void };
type Handler = (event: unknown, ctx: Ctx) => Promise<void>;

let cachedSkillMd: string | null = null;
function getSkillMd(): string {
  if (cachedSkillMd === null) {
    cachedSkillMd = readFileSync(join(skillsDir(), "caveman", "SKILL.md"), "utf8");
  }
  return cachedSkillMd;
}

function resolveMode(): Mode {
  const persisted = readFlag(claudeFlagPath());
  if (persisted && isValidMode(persisted)) return persisted as Mode;
  return getDefaultMode();
}

export function buildOnSessionCompact(): Handler {
  return async (_event, ctx) => {
    const mode = resolveMode();
    if (mode === "off") return;
    const content = INDEPENDENT_MODES.has(mode)
      ? `CAVEMAN MODE ACTIVE — level: ${mode}. Behavior defined by /caveman-${mode} skill.`
      : buildRuleset(getSkillMd(), modeLabel(mode));
    ctx.appendEntry({ customType: "pi-caveman-reanchor", content, display: false });
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/bootstrap/on-session-compact.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/on-session-compact.ts src/bootstrap/on-session-compact.test.ts
git commit -m "feat: re-anchor caveman ruleset after session_compact"
```

---

## Task 23: `commands/help.ts` — `/caveman-help`

**Files:**
- Create: `src/commands/help.ts`
- Test: `src/commands/help.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { handleHelp } from "./help.js";

describe("handleHelp", () => {
  it("notifies with help skill body", async () => {
    const notify = vi.fn();
    await handleHelp("", { ui: { notify } } as never);
    expect(notify).toHaveBeenCalledTimes(1);
    const [text, level] = notify.mock.calls[0] ?? [];
    expect(text).toContain("Caveman Help");
    expect(text).toContain("/caveman");
    expect(level).toBe("info");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/help.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { skillsDir } from "../common/paths.js";

type Ctx = { ui: { notify: (text: string, level: string) => void } };

let cachedHelp: string | null = null;
function loadHelp(): string {
  if (cachedHelp !== null) return cachedHelp;
  const raw = readFileSync(join(skillsDir(), "caveman-help", "SKILL.md"), "utf8");
  cachedHelp = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  return cachedHelp;
}

export async function handleHelp(_args: string, ctx: Ctx): Promise<void> {
  ctx.ui.notify(loadHelp(), "info");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/help.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/commands/help.ts src/commands/help.test.ts
git commit -m "feat: /caveman-help renders skill body"
```

---

## Task 24: `commands/caveman.ts` — mode toggle handler

**Files:**
- Create: `src/commands/caveman.ts`
- Test: `src/commands/caveman.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCaveman } from "./caveman.js";

describe("handleCaveman", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-cmd-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("sets mode to ultra and updates status", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("ultra", { ui: { setStatus, notify } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
    expect(notify).toHaveBeenCalledWith("caveman → ultra", "success");
  });

  it("defaults to full when no arg provided", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("", { ui: { setStatus, notify } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("full");
  });

  it("rejects invalid arg with error notify", async () => {
    const notify = vi.fn();
    await handleCaveman("bogus", { ui: { setStatus: vi.fn(), notify } } as never);
    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining("invalid mode"),
      "error",
    );
  });

  it("off skips status update", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("off", { ui: { setStatus, notify } } as never);
    expect(setStatus).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("caveman → off", "success");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/caveman.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { claudeFlagPath } from "../common/paths.js";
import { safeWriteFlag } from "../config/flag.js";
import { isValidMode, type Mode } from "../config/modes.js";
import { CAVEMAN_EXT_ID, formatStatus } from "../ui/status.js";

type Ctx = {
  ui: {
    setStatus: (id: string, text: string) => void;
    notify: (text: string, level: string) => void;
  };
};

function resolveArg(arg: string): Mode | null {
  if (arg === "") return "full";
  return isValidMode(arg) ? (arg as Mode) : null;
}

export async function handleCaveman(args: string, ctx: Ctx): Promise<void> {
  const arg = args.trim().toLowerCase();
  const mode = resolveArg(arg);
  if (mode === null) {
    ctx.ui.notify(`invalid mode '${arg}'. valid: lite, full, ultra, wenyan, wenyan-lite, wenyan-full, wenyan-ultra, off`, "error");
    return;
  }
  safeWriteFlag(claudeFlagPath(), mode);
  if (mode !== "off") ctx.ui.setStatus(CAVEMAN_EXT_ID, formatStatus(mode));
  ctx.ui.notify(`caveman → ${mode}`, "success");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/caveman.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/caveman.ts src/commands/caveman.test.ts
git commit -m "feat: /caveman command toggles mode"
```

---

## Task 25: `commands/commit.ts` — `/caveman-commit`

**Files:**
- Create: `src/commands/commit.ts`
- Test: `src/commands/commit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { handleCommit } from "./commit.js";

describe("handleCommit", () => {
  it("loads prompt from caveman-commit.toml and sends as user message", async () => {
    const sendUserMessage = vi.fn();
    await handleCommit("", { sendUserMessage } as never);
    expect(sendUserMessage).toHaveBeenCalledTimes(1);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("commit message");
    expect(text).toContain("Conventional Commits");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/commit.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import toml from "@iarna/toml";
import { commandsDir } from "../common/paths.js";

type Ctx = { sendUserMessage: (text: string) => Promise<void> | void };

let cachedPrompt: string | null = null;
function loadCommitPrompt(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  const raw = readFileSync(join(commandsDir(), "caveman-commit.toml"), "utf8");
  const parsed = toml.parse(raw) as { prompt?: unknown };
  if (typeof parsed.prompt !== "string") {
    throw new Error("caveman-commit.toml: missing prompt field");
  }
  cachedPrompt = parsed.prompt;
  return cachedPrompt;
}

export async function handleCommit(_args: string, ctx: Ctx): Promise<void> {
  await ctx.sendUserMessage(loadCommitPrompt());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/commit.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/commands/commit.ts src/commands/commit.test.ts
git commit -m "feat: /caveman-commit injects upstream toml prompt"
```

---

## Task 26: `commands/review.ts` — `/caveman-review`

**Files:**
- Create: `src/commands/review.ts`
- Test: `src/commands/review.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { handleReview } from "./review.js";

describe("handleReview", () => {
  it("loads prompt from caveman-review.toml and sends as user message", async () => {
    const sendUserMessage = vi.fn();
    await handleReview("", { sendUserMessage } as never);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("Review");
    expect(text).toContain("L<line>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/review.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import toml from "@iarna/toml";
import { commandsDir } from "../common/paths.js";

type Ctx = { sendUserMessage: (text: string) => Promise<void> | void };

let cachedPrompt: string | null = null;
function loadReviewPrompt(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  const raw = readFileSync(join(commandsDir(), "caveman-review.toml"), "utf8");
  const parsed = toml.parse(raw) as { prompt?: unknown };
  if (typeof parsed.prompt !== "string") {
    throw new Error("caveman-review.toml: missing prompt field");
  }
  cachedPrompt = parsed.prompt;
  return cachedPrompt;
}

export async function handleReview(_args: string, ctx: Ctx): Promise<void> {
  await ctx.sendUserMessage(loadReviewPrompt());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/review.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/commands/review.ts src/commands/review.test.ts
git commit -m "feat: /caveman-review injects upstream toml prompt"
```

---

## Task 27: `commands/init.ts` — `/caveman-init` shells the upstream tool

**Files:**
- Create: `src/commands/init.ts`
- Test: `src/commands/init.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { handleInit } from "./init.js";

describe("handleInit", () => {
  it("invokes spawn with caveman-init.js and args, streaming stdout", async () => {
    const writes: string[] = [];
    const fakeChild = {
      stdout: { on: (_e: string, cb: (b: Buffer) => void) => { cb(Buffer.from("done\n")); } },
      stderr: { on: () => {} },
      on: (_e: string, cb: (code: number) => void) => { if (_e === "close") cb(0); },
    };
    const spawn = vi.fn(() => fakeChild);
    const notify = (text: string) => writes.push(text);
    await handleInit("--dry-run", { ui: { notify } } as never, { spawn: spawn as never });
    expect(spawn).toHaveBeenCalledTimes(1);
    const callArgs = spawn.mock.calls[0] as [string, string[], unknown];
    expect(callArgs[0]).toBe("node");
    expect(callArgs[1][0]).toMatch(/caveman-init\.js$/);
    expect(callArgs[1][1]).toBe("--dry-run");
    expect(writes.join("")).toContain("done");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/init.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { spawn as defaultSpawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { toolsDir } from "../common/paths.js";

type Ctx = { ui: { notify: (text: string, level?: string) => void } };
type SpawnFn = (cmd: string, args: string[], opts: { stdio: "pipe" }) => ChildProcess;

export async function handleInit(
  args: string,
  ctx: Ctx,
  deps: { spawn: SpawnFn } = { spawn: defaultSpawn as SpawnFn },
): Promise<void> {
  const tool = join(toolsDir(), "caveman-init.js");
  const argv = args.trim() ? args.trim().split(/\s+/) : [];
  const child = deps.spawn("node", [tool, ...argv], { stdio: "pipe" });
  child.stdout?.on("data", (b: Buffer) => ctx.ui.notify(b.toString()));
  child.stderr?.on("data", (b: Buffer) => ctx.ui.notify(b.toString(), "warning"));
  await new Promise<void>((resolve) => {
    child.on("close", (code) => {
      ctx.ui.notify(`caveman-init exited (code ${code ?? "?"})`, code === 0 ? "info" : "error");
      resolve();
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/init.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/commands/init.ts src/commands/init.test.ts
git commit -m "feat: /caveman-init shells out to upstream tool"
```

---

## Task 28: `commands/stats.ts` — read pi session jsonl, render card

**Files:**
- Create: `src/commands/stats.ts`
- Test: `src/commands/stats.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runStats } from "./stats.js";

describe("runStats", () => {
  let tmp: string;
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "pi-caveman-stats-")); });
  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  it("renders no-data when session file is empty", async () => {
    const file = join(tmp, "session.jsonl");
    writeFileSync(file, "");
    const out = await runStats(
      { sessionManager: { getSessionFile: () => file }, ui: { notify: vi.fn() } } as never,
      { share: false, all: false },
    );
    expect(out).toContain("No usage yet");
  });

  it("renders card with totals from jsonl", async () => {
    const file = join(tmp, "session.jsonl");
    writeFileSync(
      file,
      [
        JSON.stringify({ type: "session" }),
        JSON.stringify({
          type: "message",
          message: { role: "assistant", content: [], usage: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 } },
        }),
      ].join("\n"),
    );
    const out = await runStats(
      { sessionManager: { getSessionFile: () => file }, ui: { notify: vi.fn() } } as never,
      { share: false, all: false },
    );
    expect(out).toContain("input       100");
    expect(out).toContain("output      50");
    expect(out).toContain("messages    1");
  });

  it("returns helpful message when no session file", async () => {
    const out = await runStats(
      { sessionManager: { getSessionFile: () => null }, ui: { notify: vi.fn() } } as never,
      { share: false, all: false },
    );
    expect(out).toContain("no active session");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/stats.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readFileSync } from "node:fs";
import { parseSessionTotals } from "../stats/parse.js";
import { renderStatsCard } from "../stats/render.js";

type Ctx = {
  sessionManager: { getSessionFile: () => string | null };
  ui: { notify: (text: string, level: string) => void };
};

export type StatsArgs = Readonly<{ share: boolean; all: boolean; since?: string }>;

export async function runStats(ctx: Ctx, _args: StatsArgs): Promise<string> {
  const file = ctx.sessionManager.getSessionFile();
  if (!file) return "🪨 caveman stats — no active session.";
  let raw = "";
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return "🪨 caveman stats — could not read session file.";
  }
  const totals = parseSessionTotals(raw);
  return renderStatsCard(totals);
}

export async function handleStats(args: string, ctx: Ctx): Promise<void> {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  const sinceIdx = parts.indexOf("--since");
  const since = sinceIdx >= 0 ? parts[sinceIdx + 1] : undefined;
  const card = await runStats(ctx, {
    share: parts.includes("--share"),
    all: parts.includes("--all"),
    ...(since ? { since } : {}),
  });
  ctx.ui.notify(card, "info");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/stats.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/stats.ts src/commands/stats.test.ts
git commit -m "feat: /caveman-stats renders session token totals"
```

---

## Task 29: `commands/register.ts` — wire all 6 commands

**Files:**
- Create: `src/commands/register.ts`
- Test: `src/commands/register.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { registerCommands } from "./register.js";

describe("registerCommands", () => {
  it("registers all 6 caveman slash commands", () => {
    const registerCommand = vi.fn();
    registerCommands({ registerCommand } as never);
    const names = registerCommand.mock.calls.map((c) => c[0] as string).sort();
    expect(names).toEqual([
      "caveman", "caveman-commit", "caveman-help", "caveman-init", "caveman-review", "caveman-stats",
    ]);
  });

  it("each registration includes a description and handler", () => {
    const registerCommand = vi.fn();
    registerCommands({ registerCommand } as never);
    for (const call of registerCommand.mock.calls) {
      const spec = call[1] as { description?: unknown; handler?: unknown };
      expect(typeof spec.description).toBe("string");
      expect(typeof spec.handler).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/commands/register.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { handleCaveman } from "./caveman.js";
import { handleCommit } from "./commit.js";
import { handleHelp } from "./help.js";
import { handleInit } from "./init.js";
import { handleReview } from "./review.js";
import { handleStats } from "./stats.js";

type ExtensionAPI = {
  registerCommand: (name: string, spec: { description: string; handler: (args: string, ctx: unknown) => Promise<void> }) => void;
};

export function registerCommands(pi: ExtensionAPI): void {
  pi.registerCommand("caveman", {
    description: "switch caveman mode (lite/full/ultra/wenyan*/off)",
    handler: handleCaveman as never,
  });
  pi.registerCommand("caveman-commit", {
    description: "generate terse caveman-style commit message",
    handler: handleCommit as never,
  });
  pi.registerCommand("caveman-review", {
    description: "one-line caveman code review comments",
    handler: handleReview as never,
  });
  pi.registerCommand("caveman-init", {
    description: "drop the always-on caveman activation rule into the current repo",
    handler: handleInit as never,
  });
  pi.registerCommand("caveman-stats", {
    description: "show real token usage and savings for current session",
    handler: handleStats as never,
  });
  pi.registerCommand("caveman-help", {
    description: "quick-reference card for caveman modes and commands",
    handler: handleHelp as never,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/commands/register.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/register.ts src/commands/register.test.ts
git commit -m "feat: register all 6 caveman slash commands"
```

---

## Task 30: `src/index.ts` — extension entrypoint

**Files:**
- Modify: `src/index.ts`
- Create: `src/api.ts`

- [ ] **Step 1: Write `src/api.ts` (only barrel)**

```ts
// biome-ignore lint/performance/noBarrelFile: api.ts is the designated public surface
export { handleCaveman } from "./commands/caveman.js";
export { runStats } from "./commands/stats.js";
export { detectModeChange } from "./bootstrap/activations.js";
export { buildRuleset } from "./bootstrap/ruleset.js";
export { VALID_MODES, INDEPENDENT_MODES, modeLabel, isValidMode, ModeSchema } from "./config/modes.js";
export type { Mode, ModeLabel } from "./config/modes.js";
export { getDefaultMode } from "./config/default-mode.js";
export { safeWriteFlag, readFlag } from "./config/flag.js";
export { renderStatsCard } from "./stats/render.js";
export { parseSessionTotals } from "./stats/parse.js";
export type { Totals } from "./stats/parse.js";
export type { Usage } from "./stats/extract-usage.js";
```

- [ ] **Step 2: Replace `src/index.ts` with the wired entrypoint**

```ts
import { buildOnBeforeAgentStart } from "./bootstrap/on-before-agent-start.js";
import { buildOnInput } from "./bootstrap/on-input.js";
import { buildOnSessionCompact } from "./bootstrap/on-session-compact.js";
import { buildOnSessionStart } from "./bootstrap/on-session-start.js";
import { runStats } from "./commands/stats.js";
import { registerCommands } from "./commands/register.js";
import { registerCavecrew } from "./subagents/register.js";

type ExtensionAPI = {
  on: (event: string, handler: (...args: unknown[]) => unknown) => void;
  registerTool: (tool: unknown) => void;
  registerCommand: (name: string, spec: unknown) => void;
};

export default async function piCavemanExtension(pi: ExtensionAPI): Promise<void> {
  pi.on("session_start", buildOnSessionStart() as never);
  pi.on("before_agent_start", buildOnBeforeAgentStart() as never);
  pi.on("input", buildOnInput({ runStats }) as never);
  pi.on("session_compact", buildOnSessionCompact() as never);

  pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
    await registerCavecrew(pi as never, ctx as never);
  }) as never);

  registerCommands(pi as never);
}
```

- [ ] **Step 3: Typecheck the whole tree**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Run all unit tests**

Run: `npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/api.ts
git commit -m "feat: wire pi-caveman extension entrypoint"
```

---

## Task 31: `scripts/check-blank-lines.sh`

**Files:**
- Create: `scripts/check-blank-lines.sh`

- [ ] **Step 1: Write the script (port from pi-tasks)**

```bash
#!/usr/bin/env bash
# Enforce a blank line between consecutive multi-line blocks at the same indent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXIT=0
while IFS= read -r -d '' file; do
  awk '
    /^[[:space:]]*\/\// { next }
    {
      indent = match($0, /[^[:space:]]/) - 1
      line = $0
      closer = (line ~ /^[[:space:]]*(\}|\};|\}\);|\]|\];|\]\);)[[:space:]]*$/)
      opener_next = (next_line ~ /\{[[:space:]]*$/ || next_line ~ /\([[:space:]]*$/)
      if (was_closer && indent == prev_indent) {
        ind_match = match($0, /[^[:space:]]/) - 1
        if (ind_match == prev_indent && ($0 ~ /\{[[:space:]]*$/ || $0 ~ /\([[:space:]]*$/)) {
          printf "%s:%d: missing blank line before block\n", FILENAME, NR
          status = 1
        }
      }
      if (closer) { was_closer = 1; prev_indent = indent } else { was_closer = 0 }
    }
    END { exit status }
  ' "$file" || EXIT=1
done < <(find "$ROOT/src" -name "*.ts" -not -name "*.test.ts" -print0)
exit $EXIT
```

- [ ] **Step 2: Make executable + run**

Run: `chmod +x scripts/check-blank-lines.sh && bash scripts/check-blank-lines.sh`
Expected: exit 0 (no violations) for current src/.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-blank-lines.sh
git commit -m "chore: enforce blank-line rule via script"
```

---

## Task 32: `scripts/parity-check.ts`

**Files:**
- Create: `scripts/parity-check.ts`
- Test: `scripts/parity-check.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { runParityCheck } from "./parity-check.js";

describe("runParityCheck", () => {
  it("passes when registered surface matches vendor", async () => {
    const result = await runParityCheck();
    expect(result.errors).toEqual([]);
  });

  it("returns shape { errors, warnings }", async () => {
    const result = await runParityCheck();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/parity-check.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
import { readdir } from "node:fs/promises";
import { agentsDir, commandsDir, skillsDir } from "../src/common/paths.js";

const REGISTERED_COMMANDS = new Set(["caveman", "caveman-commit", "caveman-review", "caveman-init"]);
const REGISTERED_AGENTS = new Set(["cavecrew-builder", "cavecrew-investigator", "cavecrew-reviewer"]);
const KNOWN_SKILLS = new Set([
  "caveman", "caveman-commit", "caveman-review", "caveman-help",
  "caveman-stats", "cavecrew", "compress",
]);

export type ParityResult = { errors: string[]; warnings: string[] };

export async function runParityCheck(): Promise<ParityResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const tomls = (await readdir(commandsDir())).filter((f) => f.endsWith(".toml"));
  const tomlNames = tomls.map((f) => f.replace(/\.toml$/, ""));
  for (const t of tomlNames) {
    if (!REGISTERED_COMMANDS.has(t)) {
      errors.push(`unregistered upstream command: ${t}.toml`);
    }
  }

  const agents = (await readdir(agentsDir())).filter((f) => f.endsWith(".md"));
  const agentNames = agents.map((f) => f.replace(/\.md$/, ""));
  for (const a of agentNames) {
    if (!REGISTERED_AGENTS.has(a)) {
      errors.push(`unregistered upstream agent: ${a}.md`);
    }
  }

  const skills = await readdir(skillsDir());
  for (const s of skills) {
    if (s.startsWith(".")) continue;
    if (!KNOWN_SKILLS.has(s)) {
      warnings.push(`new upstream skill (auto-loads, please review): ${s}`);
    }
  }
  return { errors, warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runParityCheck();
  for (const w of result.warnings) console.warn(`[parity] ${w}`);
  for (const e of result.errors) console.error(`[parity] ${e}`);
  process.exit(result.errors.length === 0 ? 0 : 1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/parity-check.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Run the script**

Run: `npm run parity-check`
Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/parity-check.ts scripts/parity-check.test.ts
git commit -m "chore: add parity check against vendor surface"
```

---

## Task 33: Run full `npm run check`

**Files:**
- (none — verification step)

- [ ] **Step 1: Run the full check**

Run: `npm run check`
Expected: lint + blank-line + typecheck + tests + parity-check all pass.

- [ ] **Step 2: Fix any issues encountered**

If any step fails, fix the underlying issue (do not bypass). Commit fixes with `fix:` or `style:` prefix as appropriate.

- [ ] **Step 3: Commit any cleanup**

If any fixes were needed:
```bash
git add -p   # review per-hunk
git commit -m "style: pass full check suite"
```

---

## Task 34: E2E — activation

**Files:**
- Create: `tests/e2e/activation-e2e.test.ts`

- [ ] **Step 1: Write the E2E test**

```ts
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("activation E2E", () => {
  it("default mode produces caveman-style output (no 'Sure!', short)", () => {
    const result = spawnSync(
      PI_BIN!,
      ["-e", "./src/index.ts", "-p", "explain async/await briefly"],
      { encoding: "utf8", timeout: 90_000, env: { ...process.env, CAVEMAN_DEFAULT_MODE: "full" } },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/^Sure[!,]/i);
    expect(result.stdout).not.toMatch(/I'd be happy/i);
  });
});
```

- [ ] **Step 2: Run E2E (only if `PI_BIN` set)**

Run: `PI_BIN=$(which pi) npm run test:e2e -- tests/e2e/activation-e2e.test.ts`
Expected: PASS (skipped if no PI_BIN).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/activation-e2e.test.ts
git commit -m "test: e2e activation produces caveman-shaped output"
```

---

## Task 35: E2E — mode switch

**Files:**
- Create: `tests/e2e/mode-switch-e2e.test.ts`

- [ ] **Step 1: Write the E2E test**

```ts
import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("mode switch E2E", () => {
  it("/caveman ultra makes next response shorter than full", async () => {
    const send = (input: string): Promise<string> => new Promise((resolve) => {
      const child = spawn(PI_BIN!, ["-e", "./src/index.ts", "-p", input], { stdio: "pipe" });
      let buf = "";
      child.stdout.on("data", (b) => { buf += String(b); });
      child.on("close", () => resolve(buf));
    });
    const full = await send("explain database connection pooling");
    const ultra = await send("/caveman ultra\nexplain database connection pooling");
    expect(ultra.length).toBeLessThan(full.length);
  }, 180_000);
});
```

- [ ] **Step 2: Run**

Run: `PI_BIN=$(which pi) npm run test:e2e -- tests/e2e/mode-switch-e2e.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/mode-switch-e2e.test.ts
git commit -m "test: e2e mode switch shortens output"
```

---

## Task 36: E2E — stats short-circuit

**Files:**
- Create: `tests/e2e/stats-e2e.test.ts`

- [ ] **Step 1: Write the E2E test**

```ts
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("/caveman-stats E2E", () => {
  it("returns numeric card without model round-trip", () => {
    const result = spawnSync(
      PI_BIN!,
      ["-e", "./src/index.ts", "-p", "/caveman-stats"],
      { encoding: "utf8", timeout: 30_000 },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/🪨 caveman stats|No usage yet/);
  });
});
```

- [ ] **Step 2: Run**

Run: `PI_BIN=$(which pi) npm run test:e2e -- tests/e2e/stats-e2e.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/stats-e2e.test.ts
git commit -m "test: e2e stats short-circuits model"
```

---

## Task 37: E2E — cavecrew dispatch

**Files:**
- Create: `tests/e2e/cavecrew-e2e.test.ts`

- [ ] **Step 1: Write the E2E test**

```ts
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("cavecrew agent E2E", () => {
  it("cavecrew-investigator dispatch returns path:line table", () => {
    const prompt = `Use the agent tool to dispatch cavecrew-investigator with task: "find where claudeFlagPath is defined in this repo". Output only the agent's final result.`;
    const result = spawnSync(
      PI_BIN!,
      ["-e", "./src/index.ts", "-p", prompt],
      { encoding: "utf8", timeout: 180_000 },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/paths\.ts:\d+|src\/common\/paths\.ts/);
  });
});
```

- [ ] **Step 2: Run**

Run: `PI_BIN=$(which pi) npm run test:e2e -- tests/e2e/cavecrew-e2e.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/cavecrew-e2e.test.ts
git commit -m "test: e2e cavecrew investigator returns path:line"
```

---

## Task 38: README polish + final check

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Expand README with the full feature table, troubleshooting section, and link to spec**

Append the following sections after the "Features" table currently in the file:

```markdown
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
```

- [ ] **Step 2: Run final check**

Run: `npm run check`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: expand README with config, troubleshooting, sync workflow"
```

- [ ] **Step 4: Tag**

```bash
git tag v0.1.0
```

---

## Self-review

| Spec section | Implemented in tasks |
|---|---|
| §3 user-visible surface — slash commands | Tasks 23–29 |
| §3 — auto-discovered skills | Task 1 (manifest) + Task 2 (vendor sync) |
| §3 — agent tool dispatch | Tasks 15–18 |
| §3 — footer status | Tasks 14, 19 |
| §3 — natural-language activation | Task 10 |
| §3 — flag file | Task 8 |
| §4 architecture — repo layout | Tasks 1–32 |
| §5.1 session activation | Task 19 |
| §5.2 per-turn injection | Task 20 |
| §5.3 stats short-circuit | Task 21 |
| §5.4 subagent dispatch | Tasks 15–18 |
| §5.5 compaction recovery | Task 22 |
| §6 component contracts | Tasks 6–28 |
| §7 coexistence | Documented in Task 38 README |
| §8 code style | Enforced by Task 1 biome + Task 31 blank-line check |
| §9 testing strategy | Unit covered Tasks 3–32; E2E Tasks 34–37 |
| §10 sync workflow | Task 2 + Task 38 README |
| §11 install | Task 1 README + Task 38 |

No placeholders remain. All file paths and module specifiers consistent across tasks. Every code step contains complete content, not pseudocode.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-01-pi-caveman.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
