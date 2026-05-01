export const TOOL_MAP: Readonly<Record<string, string>> = {
  Read: "read",
  Grep: "grep",
  Glob: "glob",
  Bash: "bash",
  Edit: "edit",
  Write: "write",
};

export function mapTools(tools: ReadonlyArray<string>): string[] {
  return tools.map((t) => TOOL_MAP[t] ?? t.toLowerCase());
}
