import { describe, expect, it, vi } from "vitest";
import { registerCommands } from "./register.js";

describe("registerCommands", () => {
  it("registers the 3 wrapped caveman slash commands", () => {
    const registerCommand = vi.fn();
    registerCommands({ registerCommand } as never);
    const names = registerCommand.mock.calls.map((c) => c[0] as string).sort();
    expect(names).toEqual(["caveman", "caveman-init", "caveman-stats"]);
  });

  it("each registration includes a description and handler", () => {
    const registerCommand = vi.fn();
    registerCommands({ registerCommand } as never);
    for (const call of registerCommand.mock.calls) {
      const spec = call[1] as { description?: unknown; handler?: unknown };
      expect(typeof spec.description).toBe("string");
      expect(typeof spec.handler).toBe("function");
    }
  });
});
