import { describe, expect, it, vi } from "vitest";
import { buildOnInput } from "./on-input.js";

describe("on-input", () => {
  it("passes through extension-source events", async () => {
    const handler = buildOnInput({ runStats: vi.fn() });
    const out = await handler({ text: "/caveman-stats", source: "extension" } as never, {} as never);
    expect(out).toEqual({ action: "continue" });
  });

  it("handles /caveman-stats by calling runStats and notifying", async () => {
    const runStats = vi.fn().mockResolvedValue("CARD");
    const notify = vi.fn();
    const handler = buildOnInput({ runStats });
    const out = await handler({ text: "/caveman-stats", source: "interactive" } as never, { ui: { notify } } as never);
    expect(runStats).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("CARD", "info");
    expect(out).toEqual({ action: "handled" });
  });

  it("parses --share / --all / --since flags", async () => {
    const runStats = vi.fn().mockResolvedValue("CARD");
    const handler = buildOnInput({ runStats });
    await handler(
      { text: "/caveman-stats --share --all --since 2026-01-01", source: "interactive" } as never,
      { ui: { notify: vi.fn() } } as never,
    );
    expect(runStats).toHaveBeenCalledWith(expect.anything(), { share: true, all: true, since: "2026-01-01" });
  });

  it("continues for non-stats input", async () => {
    const handler = buildOnInput({ runStats: vi.fn() });
    const out = await handler({ text: "explain async", source: "interactive" } as never, {} as never);
    expect(out).toEqual({ action: "continue" });
  });
});
