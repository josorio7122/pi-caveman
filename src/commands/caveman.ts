import { claudeFlagPath } from "../common/paths.js";
import { safeWriteFlag } from "../config/flag.js";
import { isValidMode, type Mode } from "../config/modes.js";
import { CAVEMAN_EXT_ID, formatStatus } from "../ui/status.js";

type Ctx = {
  ui: {
    setStatus: (id: string, text: string) => void;
    notify: (text: string, level: string) => void;
  };
};

function resolveArg(arg: string): Mode | null {
  if (arg === "") return "full";
  return isValidMode(arg) ? (arg as Mode) : null;
}

export async function handleCaveman(args: string, ctx: Ctx): Promise<void> {
  const arg = args.trim().toLowerCase();
  const mode = resolveArg(arg);
  if (mode === null) {
    ctx.ui.notify(
      `invalid mode '${arg}'. valid: lite, full, ultra, wenyan, wenyan-lite, wenyan-full, wenyan-ultra, off`,
      "error",
    );
    return;
  }
  safeWriteFlag(claudeFlagPath(), mode);
  if (mode !== "off") ctx.ui.setStatus(CAVEMAN_EXT_ID, formatStatus(mode));
  ctx.ui.notify(`caveman → ${mode}`, "success");
}
