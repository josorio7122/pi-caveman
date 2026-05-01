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
