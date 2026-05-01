import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileExists } from "./fs.js";

describe("fileExists", () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await mkdtemp(join(tmpdir(), "pi-caveman-fs-"));
    await writeFile(join(tmp, "exists.txt"), "x");
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("returns true for an existing file", async () => {
    expect(await fileExists(join(tmp, "exists.txt"))).toBe(true);
  });

  it("returns true for an existing directory", async () => {
    expect(await fileExists(tmp)).toBe(true);
  });

  it("returns false for a missing path", async () => {
    expect(await fileExists(join(tmp, "missing.txt"))).toBe(false);
  });
});
