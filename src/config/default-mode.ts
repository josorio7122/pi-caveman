import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isValidMode, type Mode } from "./modes.js";

function getConfigDir(): string {
  if (process.env.XDG_CONFIG_HOME) return join(process.env.XDG_CONFIG_HOME, "caveman");
  if (process.platform === "win32") {
    const appdata = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appdata, "caveman");
  }
  return join(homedir(), ".config", "caveman");
}

function readConfigMode(): Mode | null {
  try {
    const raw = readFileSync(join(getConfigDir(), "config.json"), "utf8");
    const parsed = JSON.parse(raw) as { defaultMode?: unknown };
    if (typeof parsed.defaultMode !== "string") return null;
    const lc = parsed.defaultMode.toLowerCase();
    return isValidMode(lc) ? (lc as Mode) : null;
  } catch {
    return null;
  }
}

export function getDefaultMode(): Mode {
  const env = process.env.CAVEMAN_DEFAULT_MODE;
  if (env) {
    const lc = env.toLowerCase();
    if (isValidMode(lc)) return lc as Mode;
  }
  const fromConfig = readConfigMode();
  if (fromConfig) return fromConfig;
  return "full";
}
