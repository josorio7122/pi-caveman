import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillsDir } from "../common/paths.js";
import { buildAgentConfig } from "./build-configs.js";

const baseFile = {
  filePath: "/tmp/agent.md",
  frontmatter: { name: "test-agent", description: "test", tools: ["Read", "Grep"] },
  body: "system prompt body",
};

describe("buildAgentConfig", () => {
  const skills = [{ name: "caveman", path: join(skillsDir(), "caveman", "SKILL.md"), description: "" }];

  it("maps Claude Code tools to pi names", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.tools).toEqual(["read", "grep"]);
  });

  it("falls back to default tools when frontmatter omits", () => {
    const cfg = buildAgentConfig({ ...baseFile, frontmatter: { name: "x", description: "y" } }, { skills });
    expect(cfg.frontmatter.tools).toEqual(["read", "bash", "edit", "write"]);
  });

  it("passes through model when present", () => {
    const cfg = buildAgentConfig({ ...baseFile, frontmatter: { ...baseFile.frontmatter, model: "haiku" } }, { skills });
    expect(cfg.frontmatter.model).toBe("haiku");
  });

  it("omits model when absent", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.model).toBeUndefined();
  });

  it("uses skill paths in frontmatter.skills", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.skills).toEqual([skills[0]?.path]);
  });

  it("uses caveman branding", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.frontmatter.color).toBe("#a87856");
    expect(cfg.frontmatter.icon).toBe("🪨");
  });

  it("body becomes systemPrompt verbatim", () => {
    const cfg = buildAgentConfig(baseFile, { skills });
    expect(cfg.systemPrompt).toBe("system prompt body");
  });
});
