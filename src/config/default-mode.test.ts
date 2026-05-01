import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDefaultMode } from "./default-mode.js";

describe("getDefaultMode", () => {
  let tmp: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), "pi-caveman-mode-"));
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, originalEnv);
    delete process.env.CAVEMAN_DEFAULT_MODE;
    delete process.env.XDG_CONFIG_HOME;
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("returns full when nothing is set", () => {
    process.env.XDG_CONFIG_HOME = tmp;
    expect(getDefaultMode()).toBe("full");
  });

  it("returns env var when set and valid", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    expect(getDefaultMode()).toBe("ultra");
  });

  it("ignores invalid env var, falls through", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "bogus";
    process.env.XDG_CONFIG_HOME = tmp;
    expect(getDefaultMode()).toBe("full");
  });

  it("env var is case-insensitive", () => {
    process.env.CAVEMAN_DEFAULT_MODE = "WENYAN";
    expect(getDefaultMode()).toBe("wenyan");
  });

  it("reads config file under XDG_CONFIG_HOME", async () => {
    process.env.XDG_CONFIG_HOME = tmp;
    await mkdir(join(tmp, "caveman"), { recursive: true });
    await writeFile(join(tmp, "caveman", "config.json"), JSON.stringify({ defaultMode: "lite" }));
    expect(getDefaultMode()).toBe("lite");
  });

  it("env var beats config file", async () => {
    process.env.XDG_CONFIG_HOME = tmp;
    process.env.CAVEMAN_DEFAULT_MODE = "ultra";
    await mkdir(join(tmp, "caveman"), { recursive: true });
    await writeFile(join(tmp, "caveman", "config.json"), JSON.stringify({ defaultMode: "lite" }));
    expect(getDefaultMode()).toBe("ultra");
  });
});
