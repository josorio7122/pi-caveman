import type { Mode } from "../config/modes.js";

export const CAVEMAN_EXT_ID = "pi-caveman";

export function formatStatus(mode: Mode): string {
  return `🪨 caveman · ${mode}`;
}
