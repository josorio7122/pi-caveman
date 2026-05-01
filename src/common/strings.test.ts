import { describe, expect, it } from "vitest";
import { flatten } from "./strings.js";

describe("flatten", () => {
  it("collapses whitespace and trims", () => {
    expect(flatten(`  hello   world  `)).toBe("hello world");
  });

  it("collapses newlines", () => {
    expect(flatten(`hello\n\nworld`)).toBe("hello world");
  });

  it("returns empty string unchanged", () => {
    expect(flatten("")).toBe("");
  });
});
