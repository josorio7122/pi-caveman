import { describe, expect, it } from "vitest";
import { detectModeChange } from "./activations.js";

describe("detectModeChange", () => {
  const def = "full";

  it("bare /caveman → default", () => {
    expect(detectModeChange("/caveman", def)).toEqual({ mode: "full" });
  });

  it("/caveman ultra → ultra", () => {
    expect(detectModeChange("/caveman ultra", def)).toEqual({ mode: "ultra" });
  });

  it("/caveman:caveman wenyan → wenyan", () => {
    expect(detectModeChange("/caveman:caveman wenyan", def)).toEqual({ mode: "wenyan" });
  });

  it("/caveman bogus → null (invalid arg)", () => {
    expect(detectModeChange("/caveman bogus", def)).toBeNull();
  });

  it("/caveman-commit → commit", () => {
    expect(detectModeChange("/caveman-commit", def)).toEqual({ mode: "commit" });
  });

  it("/caveman-review → review", () => {
    expect(detectModeChange("/caveman-review", def)).toEqual({ mode: "review" });
  });

  it("/caveman-compress → compress", () => {
    expect(detectModeChange("/caveman-compress", def)).toEqual({ mode: "compress" });
  });

  it("/caveman:caveman-compress → compress", () => {
    expect(detectModeChange("/caveman:caveman-compress some.md", def)).toEqual({ mode: "compress" });
  });

  it("'activate caveman' → default", () => {
    expect(detectModeChange("activate caveman please", def)).toEqual({ mode: "full" });
  });

  it("'talk like caveman' → default", () => {
    expect(detectModeChange("can you talk like caveman?", def)).toEqual({ mode: "full" });
  });

  it("'caveman mode' → default", () => {
    expect(detectModeChange("turn on caveman mode", def)).toEqual({ mode: "full" });
  });

  it("'stop caveman' → off", () => {
    expect(detectModeChange("stop caveman", def)).toEqual({ mode: "off" });
  });

  it("'turn off caveman' → off", () => {
    expect(detectModeChange("please turn off caveman", def)).toEqual({ mode: "off" });
  });

  it("activate verb + caveman + stop verb → off (stop wins)", () => {
    expect(detectModeChange("activate caveman, no wait, stop caveman", def)).toEqual({ mode: "off" });
  });

  it("unrelated text → null", () => {
    expect(detectModeChange("explain async/await", def)).toBeNull();
  });

  it("respects custom default", () => {
    expect(detectModeChange("/caveman", "ultra")).toEqual({ mode: "ultra" });
  });
});
