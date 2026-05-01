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
  const raw = readSessionFile(file);
  if (raw === null) return "🪨 caveman stats — could not read session file.";
  const totals = parseSessionTotals(raw);
  return renderStatsCard(totals);
}

function readSessionFile(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
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
