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

function buildContent(mode: Mode): string {
  if (INDEPENDENT_MODES.has(mode)) {
    return `CAVEMAN MODE ACTIVE — level: ${mode}. Behavior defined by /caveman-${mode} skill.`;
  }
  return buildRuleset(getSkillMd(), modeLabel(mode));
}

export function buildOnSessionCompact(): Handler {
  return async (_event, ctx) => {
    const mode = resolveMode();
    if (mode === "off") return;
    const content = buildContent(mode);
    ctx.appendEntry({ customType: "pi-caveman-reanchor", content, display: false });
  };
}
