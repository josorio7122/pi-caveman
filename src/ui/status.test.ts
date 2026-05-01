import { describe, expect, it } from "vitest";
import { CAVEMAN_EXT_ID, formatStatus } from "./status.js";

describe("status", () => {
  it("CAVEMAN_EXT_ID is stable", () => {
    expect(CAVEMAN_EXT_ID).toBe("pi-caveman");
  });

  it("formats active mode", () => {
    expect(formatStatus("ultra")).toBe("🪨 caveman · ultra");
  });

  it("formats off as muted", () => {
    expect(formatStatus("off")).toBe("🪨 caveman · off");
  });
});
