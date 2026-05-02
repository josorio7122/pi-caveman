import { readdir } from "node:fs/promises";
import { agentsDir, commandsDir, skillsDir } from "../src/common/paths.js";

// Commands wrapped via pi.registerCommand in src/commands/register.ts.
// These need a TS handler because they either mutate state, spawn a process,
// or deliberately bypass the model.
const WRAPPED_COMMANDS = new Set(["caveman", "caveman-init"]);

// Commands intentionally NOT wrapped: the slash command flows to the model,
// which invokes the matching auto-discovered skill (vendor/caveman/skills/<name>)
// via the `pi.skills` manifest. Same pattern as /caveman-help.
const SKILL_HANDLED_COMMANDS = new Set(["caveman-commit", "caveman-review", "caveman-help"]);

const REGISTERED_AGENTS = new Set(["cavecrew-builder", "cavecrew-investigator", "cavecrew-reviewer"]);
const KNOWN_SKILLS = new Set([
  "caveman",
  "caveman-commit",
  "caveman-review",
  "caveman-help",
  "caveman-stats",
  "cavecrew",
  "compress",
]);

export type ParityResult = { errors: string[]; warnings: string[] };

export async function runParityCheck(): Promise<ParityResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const tomls = (await readdir(commandsDir())).filter((f) => f.endsWith(".toml"));
  const tomlNames = tomls.map((f) => f.replace(/\.toml$/, ""));
  for (const t of tomlNames) {
    if (!WRAPPED_COMMANDS.has(t) && !SKILL_HANDLED_COMMANDS.has(t)) {
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
