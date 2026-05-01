import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";
import { INDEPENDENT_MODES, isValidMode, ModeSchema, modeLabel, VALID_MODES } from "./modes.js";

describe("modes", () => {
  it("VALID_MODES contains all 11 modes", () => {
    expect(VALID_MODES).toEqual([
      "off",
      "lite",
      "full",
      "ultra",
      "wenyan-lite",
      "wenyan",
      "wenyan-full",
      "wenyan-ultra",
      "commit",
      "review",
      "compress",
    ]);
  });

  it("INDEPENDENT_MODES has commit/review/compress", () => {
    expect([...INDEPENDENT_MODES].sort()).toEqual(["commit", "compress", "review"]);
  });

  it("isValidMode accepts valid modes", () => {
    expect(isValidMode("ultra")).toBe(true);
    expect(isValidMode("wenyan-full")).toBe(true);
  });

  it("isValidMode rejects invalid", () => {
    expect(isValidMode("foo")).toBe(false);
    expect(isValidMode("")).toBe(false);
  });

  it("isValidMode is case-insensitive", () => {
    expect(isValidMode("ULTRA")).toBe(true);
  });

  it("modeLabel maps wenyan to wenyan-full", () => {
    expect(modeLabel("wenyan")).toBe("wenyan-full");
  });

  it("modeLabel passes through other modes", () => {
    expect(modeLabel("ultra")).toBe("ultra");
    expect(modeLabel("wenyan-lite")).toBe("wenyan-lite");
  });

  it("ModeSchema validates known mode", () => {
    expect(Value.Check(ModeSchema, "full")).toBe(true);
    expect(Value.Check(ModeSchema, "bogus")).toBe(false);
  });
});
