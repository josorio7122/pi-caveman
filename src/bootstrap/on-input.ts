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
