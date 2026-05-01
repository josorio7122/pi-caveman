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
