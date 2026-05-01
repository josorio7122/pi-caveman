import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOnSessionCompact } from "./on-session-compact.js";

describe("on-session-compact", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-compact-"));
    process.env.CLAUDE_CONFIG_DIR = tmp;
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  it("notifies via custom_message when persisted mode is active", async () => {
    writeFileSync(join(tmp, ".caveman-active"), "ultra");
    const appendEntry = vi.fn();
    const handler = buildOnSessionCompact();
    await handler({} as never, { appendEntry } as never);
    expect(appendEntry).toHaveBeenCalled();
    const arg = (appendEntry.mock.calls[0]?.[0] ?? {}) as { content?: string };
    expect(arg.content).toContain("**ultra**");
  });

  it("no-op when mode is off", async () => {
    writeFileSync(join(tmp, ".caveman-active"), "off");
    const appendEntry = vi.fn();
    const handler = buildOnSessionCompact();
    await handler({} as never, { appendEntry } as never);
    expect(appendEntry).not.toHaveBeenCalled();
  });
});
