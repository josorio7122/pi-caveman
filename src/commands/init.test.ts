import { describe, expect, it, vi } from "vitest";
import { buildHandleInit } from "./init.js";

describe("handleInit", () => {
  it("invokes spawn with caveman-init.js and args, streaming stdout", async () => {
    const writes: string[] = [];
    const fakeChild = {
      stdout: {
        on: (_e: string, cb: (b: Buffer) => void) => {
          cb(Buffer.from("done\n"));
        },
      },
      stderr: { on: () => {} },
      on: (_e: string, cb: (code: number) => void) => {
        if (_e === "close") cb(0);
      },
    };
    const spawn = vi.fn(() => fakeChild);
    const notify = (text: string): void => {
      writes.push(text);
    };
    const handleInit = buildHandleInit({ spawn: spawn as never });
    await handleInit("--dry-run", { ui: { notify } } as never);
    expect(spawn).toHaveBeenCalledTimes(1);
    const callArgs = spawn.mock.calls[0] as unknown as [{ cmd: string; argv: string[]; stdio: string }];
    const call = callArgs[0];
    expect(call.cmd).toBe("node");
    expect(call.argv[0]).toMatch(/caveman-init\.js$/);
    expect(call.argv[1]).toBe("--dry-run");
    expect(writes.join("")).toContain("done");
  });
});
