import { describe, expect, it } from "vitest";
import { mapTools, TOOL_MAP } from "./tool-mapping.js";

describe("tool-mapping", () => {
  it("maps every Claude Code tool name", () => {
    expect(TOOL_MAP).toEqual({
      Read: "read",
      Grep: "grep",
      Glob: "glob",
      Bash: "bash",
      Edit: "edit",
      Write: "write",
    });
  });

  it("mapTools converts all known names", () => {
    expect(mapTools(["Read", "Grep", "Glob", "Bash"])).toEqual(["read", "grep", "glob", "bash"]);
  });

  it("mapTools lowercases unknown names rather than dropping", () => {
    expect(mapTools(["Read", "CustomTool"])).toEqual(["read", "customtool"]);
  });

  it("mapTools handles empty input", () => {
    expect(mapTools([])).toEqual([]);
  });
});
