import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("activation E2E", () => {
  it("default mode produces caveman-style output (no 'Sure!', short)", () => {
    const result = spawnSync(PI_BIN!, ["-e", "./src/index.ts", "-p", "explain async/await briefly"], {
      encoding: "utf8",
      timeout: 90_000,
      env: { ...process.env, CAVEMAN_DEFAULT_MODE: "full" },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/^Sure[!,]/i);
    expect(result.stdout).not.toMatch(/I'd be happy/i);
  });
});
