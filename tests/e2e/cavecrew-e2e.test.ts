import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("cavecrew agent E2E", () => {
  it("cavecrew-investigator dispatch returns path:line table", () => {
    const prompt = `Use the agent tool to dispatch cavecrew-investigator with task: "find where claudeFlagPath is defined in this repo". Output only the agent's final result.`;
    const result = spawnSync(PI_BIN!, ["-e", "./src/index.ts", "-p", prompt], { encoding: "utf8", timeout: 180_000 });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/paths\.ts:\d+|src\/common\/paths\.ts/);
  });
});
