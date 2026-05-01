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
