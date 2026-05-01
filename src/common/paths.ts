import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function packageRoot(): string {
  // src/common/paths.ts → ../../
  return join(here, "..", "..");
}

export function vendorRoot(): string {
  return join(packageRoot(), "vendor", "caveman");
}

export function skillsDir(): string {
  return join(vendorRoot(), "skills");
}

export function agentsDir(): string {
  return join(vendorRoot(), "agents");
}

export function commandsDir(): string {
  return join(vendorRoot(), "commands");
}

export function toolsDir(): string {
  return join(vendorRoot(), "tools");
}

export function claudeFlagPath(): string {
  const dir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");
  return join(dir, ".caveman-active");
}
