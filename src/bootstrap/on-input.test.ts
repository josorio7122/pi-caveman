import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("/caveman-help", () => {
    let writeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
      writeSpy.mockRestore();
    });

    it("short-circuits /caveman-help with static card", async () => {
      const runStats = vi.fn();
      const notify = vi.fn();
      const handler = buildOnInput({ runStats });
      const out = await handler({ text: "/caveman-help", source: "interactive" } as never, { ui: { notify } } as never);
      expect(runStats).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledTimes(1);
      const call = notify.mock.calls[0] ?? [];
      const card = call[0] as string;
      const level = call[1] as string;
      expect(level).toBe("info");
      expect(card).toContain("🪨 caveman quick reference");
      expect(card).not.toMatch(/Display this reference card when invoked/);
      expect(writeSpy).toHaveBeenCalled();
      expect(out).toEqual({ action: "handled" });
    });

    it("handles /caveman:caveman-help namespace form", async () => {
      const runStats = vi.fn();
      const notify = vi.fn();
      const handler = buildOnInput({ runStats });
      const out = await handler(
        { text: "/caveman:caveman-help", source: "interactive" } as never,
        { ui: { notify } } as never,
      );
      expect(runStats).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledTimes(1);
      expect(out).toEqual({ action: "handled" });
    });

    it("does not short-circuit /caveman-help-something-else", async () => {
      const runStats = vi.fn();
      const handler = buildOnInput({ runStats });
      const out = await handler(
        { text: "/caveman-help foo", source: "interactive" } as never,
        { ui: { notify: vi.fn() } } as never,
      );
      expect(out).toEqual({ action: "continue" });
    });
  });
});
