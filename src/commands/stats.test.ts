import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runStats } from "./stats.js";

describe("runStats", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pi-caveman-stats-"));
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("renders no-data when session file is empty", async () => {
    const file = join(tmp, "session.jsonl");
    writeFileSync(file, "");
    const out = await runStats({ sessionManager: { getSessionFile: () => file }, ui: { notify: vi.fn() } } as never, {
      share: false,
      all: false,
    });
    expect(out).toContain("No usage yet");
  });

  it("renders card with totals from jsonl", async () => {
    const file = join(tmp, "session.jsonl");
    writeFileSync(
      file,
      [
        JSON.stringify({ type: "session" }),
        JSON.stringify({
          type: "message",
          message: {
            role: "assistant",
            content: [],
            usage: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 },
          },
        }),
      ].join("\n"),
    );
    const out = await runStats({ sessionManager: { getSessionFile: () => file }, ui: { notify: vi.fn() } } as never, {
      share: false,
      all: false,
    });
    expect(out).toContain("input       100");
    expect(out).toContain("output      50");
    expect(out).toContain("messages    1");
  });

  it("returns helpful message when no session file", async () => {
    const out = await runStats({ sessionManager: { getSessionFile: () => null }, ui: { notify: vi.fn() } } as never, {
      share: false,
      all: false,
    });
    expect(out).toContain("no active session");
  });
});
