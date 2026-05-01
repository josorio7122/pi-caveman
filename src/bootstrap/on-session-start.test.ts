import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnSessionStart } from "./on-session-start.js";

describe("on-session-start", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-sess-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
    delete process.env.CAVEMAN_DEFAULT_MODE;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("writes flag and sets status with default mode", async () => {
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("full");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · full");
  });

  it("respects env override", async () => {
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
  });

  it("does not set status when mode is off", async () => {
    process.env.CAVEMAN_DEFAULT_MODE = "off";
    const setStatus = vi.fn();
    const handler = buildOnSessionStart();
    await handler({ reason: "startup" } as never, { ui: { setStatus } } as never);
    expect(setStatus).not.toHaveBeenCalled();
  });
});
