import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCaveman } from "./caveman.js";

describe("handleCaveman", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-cmd-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("sets mode to ultra and updates status", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("ultra", { ui: { setStatus, notify } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("ultra");
    expect(setStatus).toHaveBeenCalledWith("pi-caveman", "🪨 caveman · ultra");
    expect(notify).toHaveBeenCalledWith("caveman → ultra", "success");
  });

  it("defaults to full when no arg provided", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("", { ui: { setStatus, notify } } as never);
    expect(readFileSync(join(tmp, ".caveman-active"), "utf8")).toBe("full");
  });

  it("rejects invalid arg with error notify", async () => {
    const notify = vi.fn();
    await handleCaveman("bogus", { ui: { setStatus: vi.fn(), notify } } as never);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("invalid mode"), "error");
  });

  it("off skips status update", async () => {
    const setStatus = vi.fn();
    const notify = vi.fn();
    await handleCaveman("off", { ui: { setStatus, notify } } as never);
    expect(setStatus).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("caveman → off", "success");
  });
});
