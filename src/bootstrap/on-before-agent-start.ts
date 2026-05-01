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
