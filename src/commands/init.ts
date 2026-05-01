import { type ChildProcess, spawn as defaultSpawn } from "node:child_process";
import { join } from "node:path";
import { toolsDir } from "../common/paths.js";

type Ctx = { ui: { notify: (text: string, level?: string) => void } };
type SpawnArgs = Readonly<{ cmd: string; argv: string[]; stdio: "pipe" }>;
type SpawnFn = (call: SpawnArgs) => ChildProcess;

const realSpawn: SpawnFn = (call) => defaultSpawn(call.cmd, call.argv, { stdio: call.stdio });

export function buildHandleInit(deps: { spawn?: SpawnFn } = {}) {
  const spawn = deps.spawn ?? realSpawn;
  return async function handleInit(args: string, ctx: Ctx): Promise<void> {
    const tool = join(toolsDir(), "caveman-init.js");
    const argv = args.trim() ? args.trim().split(/\s+/) : [];
    const child = spawn({ cmd: "node", argv: [tool, ...argv], stdio: "pipe" });
    child.stdout?.on("data", (b: Buffer) => ctx.ui.notify(b.toString()));
    child.stderr?.on("data", (b: Buffer) => ctx.ui.notify(b.toString(), "warning"));
    await new Promise<void>((resolve) => {
      child.on("close", (code) => {
        ctx.ui.notify(`caveman-init exited (code ${code ?? "?"})`, code === 0 ? "info" : "error");
        resolve();
      });
    });
  };
}

export const handleInit = buildHandleInit();
