import { describe, expect, it } from "vitest";
import { renderStatsCard } from "./render.js";

describe("renderStatsCard", () => {
  it("renders zero-totals as no-data card", () => {
    const out = renderStatsCard({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 });
    expect(out).toContain("No usage yet");
  });

  it("renders totals as caveman card", () => {
    const out = renderStatsCard({ input: 12000, output: 800, cacheRead: 5000, cacheWrite: 1000, messages: 6 });
    expect(out).toContain("🪨 caveman stats");
    expect(out).toMatch(/messages\s+6/);
    expect(out).toMatch(/input\s+12,000/);
    expect(out).toMatch(/output\s+800/);
    expect(out).toMatch(/cache read\s+5,000/);
    expect(out).toMatch(/cache write\s+1,000/);
  });
});
