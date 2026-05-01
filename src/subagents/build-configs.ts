import type { AgentFile } from "./loader.js";
import { mapTools } from "./tool-mapping.js";

export type Skill = Readonly<{ name: string; path: string; description: string }>;

export type PiAgentConfig = Readonly<{
  frontmatter: Readonly<{
    name: string;
    description: string;
    model?: string;
    color: string;
    icon: string;
    tools: ReadonlyArray<string>;
    skills: ReadonlyArray<string>;
  }>;
  systemPrompt: string;
  filePath: string;
  source: "user";
}>;

export type BuildCtx = Readonly<{ skills: ReadonlyArray<Skill> }>;

const DEFAULT_PI_TOOLS = ["read", "bash", "edit", "write"] as const;

export function buildAgentConfig(file: AgentFile, ctx: BuildCtx): PiAgentConfig {
  const tools =
    file.frontmatter.tools && file.frontmatter.tools.length > 0
      ? mapTools(file.frontmatter.tools)
      : [...DEFAULT_PI_TOOLS];

  return {
    frontmatter: {
      name: file.frontmatter.name,
      description: file.frontmatter.description,
      ...(file.frontmatter.model ? { model: file.frontmatter.model } : {}),
      color: "#a87856",
      icon: "🪨",
      tools,
      skills: ctx.skills.map((s) => s.path),
    },
    systemPrompt: file.body,
    filePath: file.filePath,
    source: "user",
  };
}
