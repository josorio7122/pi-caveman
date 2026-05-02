import { readFileSync } from "node:fs";
import { join } from "node:path";
import toml from "@iarna/toml";
import { commandsDir } from "../common/paths.js";

type PiSender = { sendUserMessage: (text: string) => void | Promise<void> };

let cachedPrompt: string | null = null;
function loadCommitPrompt(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  const raw = readFileSync(join(commandsDir(), "caveman-commit.toml"), "utf8");
  const parsed = toml.parse(raw) as { prompt?: unknown };
  if (typeof parsed.prompt !== "string") {
    throw new Error("caveman-commit.toml: missing prompt field");
  }
  cachedPrompt = parsed.prompt;
  return cachedPrompt;
}

export function buildHandleCommit(pi: PiSender) {
  return async (_args: string, _ctx: unknown): Promise<void> => {
    await pi.sendUserMessage(loadCommitPrompt());
  };
}
