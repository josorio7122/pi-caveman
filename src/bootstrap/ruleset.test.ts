import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillsDir } from "../common/paths.js";
import { buildRuleset } from "./ruleset.js";

const skillMd = readFileSync(join(skillsDir(), "caveman", "SKILL.md"), "utf8");

describe("buildRuleset", () => {
  it("strips YAML frontmatter", () => {
    const out = buildRuleset(skillMd, "full");
    expect(out.startsWith("---")).toBe(false);
  });

  it("keeps active level row, drops other intensity rows", () => {
    const out = buildRuleset(skillMd, "full");
    expect(out).toMatch(/\| \*\*full\*\* \|/);
    expect(out).not.toMatch(/\| \*\*ultra\*\* \|/);
    expect(out).not.toMatch(/\| \*\*wenyan-full\*\* \|/);
  });

  it("keeps only active example lines", () => {
    const out = buildRuleset(skillMd, "ultra");
    expect(out).toMatch(/^- ultra:/m);
    expect(out).not.toMatch(/^- full:/m);
    expect(out).not.toMatch(/^- lite:/m);
  });

  it("keeps table header and separator rows regardless of mode", () => {
    const out = buildRuleset(skillMd, "lite");
    expect(out).toMatch(/\| Level \| What change \|/);
    expect(out).toMatch(/\|-+\|-+\|/);
  });

  it("snapshot per mode", () => {
    for (const mode of ["lite", "full", "ultra", "wenyan-lite", "wenyan-full", "wenyan-ultra"] as const) {
      expect(buildRuleset(skillMd, mode)).toMatchSnapshot(mode);
    }
  });
});
