import { describe, expect, it, vi } from "vitest";
import { registerCavecrew } from "./register.js";

describe("registerCavecrew", () => {
  it("registers a single agent tool with all valid configs", async () => {
    const registerTool = vi.fn();
    const ctx = {
      cwd: "/tmp",
      sessionManager: { getSessionDir: () => "/tmp/sess" },
      modelRegistry: {},
      ui: { notify: vi.fn() },
    };

    const fakeCreate = vi.fn(() => ({ name: "agent" }));
    await registerCavecrew(
      { pi: { registerTool } as never, ctx: ctx as never },
      { createAgentTool: fakeCreate as never },
    );

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(fakeCreate).toHaveBeenCalledOnce();
    const firstCall = fakeCreate.mock.calls[0] as unknown as [{ agents: Array<{ frontmatter: { name: string } }> }];
    const call = firstCall[0];
    expect(call.agents.map((a) => a.frontmatter.name).sort()).toEqual([
      "cavecrew-builder",
      "cavecrew-investigator",
      "cavecrew-reviewer",
    ]);
  });

  it("notifies user on count", async () => {
    const registerTool = vi.fn();
    const notify = vi.fn();
    const ctx = {
      cwd: "/tmp",
      sessionManager: { getSessionDir: () => "/tmp/sess" },
      modelRegistry: {},
      ui: { notify },
    };
    await registerCavecrew(
      { pi: { registerTool } as never, ctx: ctx as never },
      { createAgentTool: vi.fn(() => ({})) as never },
    );
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/cavecrew · 3 agent/), "info");
  });
});
