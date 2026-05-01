import { describe, expect, it } from "vitest";
import { agentsDir } from "../common/paths.js";
import { loadAgentFiles } from "./loader.js";

describe("loadAgentFiles", () => {
  it("loads three cavecrew agents", async () => {
    const result = await loadAgentFiles(agentsDir());
    const names = result.files.map((f) => f.frontmatter.name).sort();
    expect(names).toEqual(["cavecrew-builder", "cavecrew-investigator", "cavecrew-reviewer"]);
  });

  it("returns body without frontmatter", async () => {
    const result = await loadAgentFiles(agentsDir());
    const inv = result.files.find((f) => f.frontmatter.name === "cavecrew-investigator");
    expect(inv).toBeDefined();
    expect(inv?.body.startsWith("---")).toBe(false);
    expect(inv?.body).toContain("Caveman-ultra");
  });

  it("includes diagnostics list (empty for valid vendor)", async () => {
    const result = await loadAgentFiles(agentsDir());
    expect(result.diagnostics).toEqual([]);
  });

  it("handles missing dir gracefully", async () => {
    const result = await loadAgentFiles("/nonexistent/path");
    expect(result.files).toEqual([]);
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0]?.level).toBe("warn");
  });
});
