import { homedir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { agentsDir, claudeFlagPath, packageRoot, skillsDir, vendorRoot } from "./paths.js";

describe("paths", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => { Object.assign(process.env, originalEnv); });
  afterEach(() => { for (const k of Object.keys(process.env)) delete process.env[k]; Object.assign(process.env, originalEnv); });

  it("packageRoot resolves to repo root containing package.json", () => {
    const root = packageRoot();
    expect(root).toMatch(/pi-caveman$/);
  });

  it("vendorRoot is packageRoot/vendor/caveman", () => {
    expect(vendorRoot()).toBe(`${packageRoot()}/vendor/caveman`);
  });

  it("skillsDir is vendorRoot/skills", () => {
    expect(skillsDir()).toBe(`${vendorRoot()}/skills`);
  });

  it("agentsDir is vendorRoot/agents", () => {
    expect(agentsDir()).toBe(`${vendorRoot()}/agents`);
  });

  it("claudeFlagPath defaults to ~/.claude/.caveman-active", () => {
    delete process.env.CLAUDE_CONFIG_DIR;
    expect(claudeFlagPath()).toBe(`${homedir()}/.claude/.caveman-active`);
  });

  it("claudeFlagPath honors CLAUDE_CONFIG_DIR", () => {
    process.env.CLAUDE_CONFIG_DIR = "/tmp/fake-claude";
    expect(claudeFlagPath()).toBe("/tmp/fake-claude/.caveman-active");
  });
});
