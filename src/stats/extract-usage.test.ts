import { describe, expect, it } from "vitest";
import { extractUsage } from "./extract-usage.js";

describe("extractUsage", () => {
  it("returns null for non-message entries", () => {
    expect(extractUsage({ type: "session" })).toBeNull();
    expect(extractUsage({ type: "model_change" })).toBeNull();
  });

  it("returns null when message has no usage", () => {
    expect(extractUsage({ type: "message", message: { role: "user", content: [] } })).toBeNull();
  });

  it("extracts pi-shape usage fields", () => {
    const entry = {
      type: "message",
      message: {
        role: "assistant",
        content: [],
        usage: {
          input: 10135,
          output: 352,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 10487,
        },
      },
    };
    expect(extractUsage(entry)).toEqual({ input: 10135, output: 352, cacheRead: 0, cacheWrite: 0 });
  });

  it("defaults missing fields to 0", () => {
    const entry = {
      type: "message",
      message: { role: "assistant", content: [], usage: { input: 50 } },
    };
    expect(extractUsage(entry)).toEqual({ input: 50, output: 0, cacheRead: 0, cacheWrite: 0 });
  });

  it("returns null for non-object entry", () => {
    expect(extractUsage(null)).toBeNull();
    expect(extractUsage("string")).toBeNull();
    expect(extractUsage(42)).toBeNull();
  });
});
