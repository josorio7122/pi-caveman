import { buildOnBeforeAgentStart } from "./bootstrap/on-before-agent-start.js";
import { buildOnInput } from "./bootstrap/on-input.js";
import { buildOnSessionCompact } from "./bootstrap/on-session-compact.js";
import { buildOnSessionStart } from "./bootstrap/on-session-start.js";
import { registerCommands } from "./commands/register.js";
import { runStats } from "./commands/stats.js";
import { registerCavecrew } from "./subagents/register.js";

type ExtensionAPI = {
  on: (event: string, handler: (...args: unknown[]) => unknown) => void;
  registerTool: (tool: unknown) => void;
  registerCommand: (name: string, spec: unknown) => void;
  sendUserMessage: (text: string) => void | Promise<void>;
};

export default async function piCavemanExtension(pi: ExtensionAPI): Promise<void> {
  pi.on("session_start", buildOnSessionStart() as never);
  pi.on("before_agent_start", buildOnBeforeAgentStart() as never);
  pi.on("input", buildOnInput({ runStats: runStats as never }) as never);
  pi.on("session_compact", buildOnSessionCompact() as never);

  pi.on("session_start", (async (_event: unknown, ctx: unknown) => {
    await registerCavecrew({ pi, ctx } as never);
  }) as never);

  registerCommands(pi as never);
}
