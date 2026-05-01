import { lstatSync, readFileSync, statSync, symlinkSync, unlinkSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFlag, safeWriteFlag } from "./flag.js";

describe("flag.ts", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), "pi-caveman-flag-"));
  });
  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("writes flag content atomically", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "ultra");
    expect(readFileSync(flag, "utf8")).toBe("ultra");
  });

  it("creates parent directory when missing", () => {
    const flag = join(tmp, "nested", "dir", ".caveman-active");
    safeWriteFlag(flag, "lite");
    expect(readFileSync(flag, "utf8")).toBe("lite");
  });

  it("uses 0600 permissions", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "full");
    const mode = statSync(flag).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("readFlag returns null for missing file", () => {
    expect(readFlag(join(tmp, "missing"))).toBeNull();
  });

  it("readFlag returns trimmed content", () => {
    const flag = join(tmp, ".caveman-active");
    safeWriteFlag(flag, "ultra");
    expect(readFlag(flag)).toBe("ultra");
  });

  it("refuses to write when flag itself is a symlink (clobber vector)", () => {
    const flag = join(tmp, ".caveman-active");
    const target = join(tmp, "victim");
    symlinkSync(target, flag);
    safeWriteFlag(flag, "ultra");
    // The symlink should still exist; victim should NOT have been written.
    expect(lstatSync(flag).isSymbolicLink()).toBe(true);
    expect(() => readFileSync(target, "utf8")).toThrow();
    unlinkSync(flag);
  });
});
