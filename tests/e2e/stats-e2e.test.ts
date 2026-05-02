import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("/caveman-stats E2E", () => {
  it("returns numeric card without model round-trip", () => {
    const result = spawnSync(PI_BIN!, ["-e", "./src/index.ts", "-p", "/caveman-stats"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/🪨 caveman stats|No usage yet/);
  });
});
