import { claudeFlagPath } from "../common/paths.js";
import { getDefaultMode } from "../config/default-mode.js";
import { safeWriteFlag } from "../config/flag.js";
import { CAVEMAN_EXT_ID, formatStatus } from "../ui/status.js";

type Ctx = { ui: { setStatus: (id: string, text: string) => void } };
type Handler = (event: unknown, ctx: Ctx) => Promise<void>;

export function buildOnSessionStart(): Handler {
  return async (_event, ctx) => {
    const mode = getDefaultMode();
    safeWriteFlag(claudeFlagPath(), mode);
    if (mode === "off") return;
    ctx.ui.setStatus(CAVEMAN_EXT_ID, formatStatus(mode));
  };
}
