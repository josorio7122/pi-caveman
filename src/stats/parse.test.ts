import { describe, expect, it } from "vitest";
import { parseSessionTotals } from "./parse.js";

const FIXTURE = [
  JSON.stringify({ type: "session", id: "s1" }),
  JSON.stringify({ type: "message", message: { role: "user", content: [] } }),
  JSON.stringify({
    type: "message",
    message: { role: "assistant", content: [], usage: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 } },
  }),
  JSON.stringify({
    type: "message",
    message: { role: "assistant", content: [], usage: { input: 80, output: 40, cacheRead: 60, cacheWrite: 20 } },
  }),
  "",
  "not-json-line",
].join("\n");

describe("parseSessionTotals", () => {
  it("sums usage fields, ignores non-usage and bad lines", () => {
    expect(parseSessionTotals(FIXTURE)).toEqual({
      input: 180,
      output: 90,
      cacheRead: 60,
      cacheWrite: 20,
      messages: 2,
    });
  });

  it("returns zeros for empty input", () => {
    expect(parseSessionTotals("")).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 });
  });
});
