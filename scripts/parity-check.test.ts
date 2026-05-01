import { describe, expect, it } from "vitest";
import { runParityCheck } from "./parity-check.js";

describe("runParityCheck", () => {
  it("passes when registered surface matches vendor", async () => {
    const result = await runParityCheck();
    expect(result.errors).toEqual([]);
  });

  it("returns shape { errors, warnings }", async () => {
    const result = await runParityCheck();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
