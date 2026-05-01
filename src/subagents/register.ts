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

export type RegisterArgs = Readonly<{ pi: ExtensionAPI; ctx: Ctx }>;
export type RegisterDeps = Readonly<{ createAgentTool: CreateAgentToolFn }>;

const DEFAULT_DEPS: RegisterDeps = { createAgentTool: defaultCreate };

function fallbackSkill(): Skill {
  return {
    name: "caveman",
    path: `${skillsDir()}/caveman/SKILL.md`,
    description: "caveman compression rules",
  };
}

export async function registerCavecrew(args: RegisterArgs, deps: RegisterDeps = DEFAULT_DEPS): Promise<void> {
  const { pi, ctx } = args;
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
