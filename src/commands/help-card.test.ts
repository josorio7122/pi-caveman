import { describe, expect, it } from "vitest";
import { renderHelpCard } from "./help-card.js";

describe("renderHelpCard", () => {
  it("includes Modes, Commands, Cavecrew sections", () => {
    const card = renderHelpCard();
    expect(card).toContain("🪨 caveman quick reference");
    expect(card).toContain("## Modes");
    expect(card).toContain("## Commands");
    expect(card).toContain("## Cavecrew");
    expect(card).toContain("## Deactivate");
    expect(card).toContain("## Configure default mode");
  });

  it("does not leak model directives", () => {
    const card = renderHelpCard();
    expect(card).not.toMatch(/Display this reference card when invoked/);
    expect(card).not.toMatch(/Output in caveman style/);
    expect(card).not.toMatch(/do NOT change mode/);
  });

  it("references all 6 slash commands", () => {
    const card = renderHelpCard();
    for (const cmd of [
      "/caveman ",
      "/caveman-commit",
      "/caveman-review",
      "/caveman-init",
      "/caveman-stats",
      "/caveman-help",
    ]) {
      expect(card).toContain(cmd);
    }
  });
});
