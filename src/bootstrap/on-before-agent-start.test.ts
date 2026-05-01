import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnBeforeAgentStart } from "./on-before-agent-start.js";

describe("on-before-agent-start", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-bas-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
    delete process.env.CAVEMAN_DEFAULT_MODE;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("appends ruleset to systemPrompt for normal mode", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "explain async/await", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(out.systemPrompt?.startsWith("ORIG\n\n")).toBe(true);
    expect(out.systemPrompt).toContain("**full**");
  });

  it("flips mode on /caveman ultra and writes flag", async () => {
    const setStatus = vi.fn();
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "/caveman ultra", systemPrompt: "ORIG" } as never,
      { ui: { setStatus } } as never,
    );
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
    expect(out.systemPrompt).toContain("**ultra**");
  });

  it("returns empty when mode is off", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "stop caveman", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("off");
    expect(out).toEqual({});
  });

  it("uses short activation line for INDEPENDENT_MODES", async () => {
    const handler = buildOnBeforeAgentStart();
    const out = await handler(
      { prompt: "/caveman-commit", systemPrompt: "ORIG" } as never,
      { ui: { setStatus: vi.fn() } } as never,
    );
    expect(out.systemPrompt).toMatch(
      /CAVEMAN MODE ACTIVE — level: commit\. Behavior defined by \/caveman-commit skill\./,
    );
  });
});
