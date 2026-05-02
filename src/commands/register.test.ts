import { describe, expect, it, vi } from "vitest";
import { registerCommands } from "./register.js";

describe("registerCommands", () => {
  it("registers the 6 wrapped caveman slash commands", () => {
    const pi = {
      registerCommand: vi.fn(),
      sendUserMessage: vi.fn(),
    };
    registerCommands(pi as never);
    const names = pi.registerCommand.mock.calls.map((c) => c[0] as string).sort();
    expect(names).toEqual([
      "caveman",
      "caveman-commit",
      "caveman-help",
      "caveman-init",
      "caveman-review",
      "caveman-stats",
    ]);
  });

  it("each registration includes a description and handler", () => {
    const pi = {
      registerCommand: vi.fn(),
      sendUserMessage: vi.fn(),
    };
    registerCommands(pi as never);
    for (const call of pi.registerCommand.mock.calls) {
      const spec = call[1] as { description?: unknown; handler?: unknown };
      expect(typeof spec.description).toBe("string");
      expect(typeof spec.handler).toBe("function");
    }
  });
});
