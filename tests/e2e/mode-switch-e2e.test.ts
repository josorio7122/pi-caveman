import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

const PI_BIN = process.env.PI_BIN;

describe.runIf(PI_BIN)("mode switch E2E", () => {
  it("/caveman ultra makes next response shorter than full", async () => {
    const send = (input: string): Promise<string> =>
      new Promise((resolve) => {
        const child = spawn(PI_BIN!, ["-e", "./src/index.ts", "-p", input], { stdio: "pipe" });
        let buf = "";
        child.stdout.on("data", (b) => {
          buf += String(b);
        });
        child.on("close", () => resolve(buf));
      });
    const full = await send("explain database connection pooling");
    const ultra = await send("/caveman ultra\nexplain database connection pooling");
    expect(ultra.length).toBeLessThan(full.length);
  }, 180_000);
});
