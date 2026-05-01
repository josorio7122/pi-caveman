import { readFileSync } from "node:fs";
import { join } from "node:path";
import toml from "@iarna/toml";
import { commandsDir } from "../common/paths.js";

type Ctx = { sendUserMessage: (text: string) => Promise<void> | void };

let cachedPrompt: string | null = null;
function loadReviewPrompt(): string {
  if (cachedPrompt !== null) return cachedPrompt;
  const raw = readFileSync(join(commandsDir(), "caveman-review.toml"), "utf8");
  const parsed = toml.parse(raw) as { prompt?: unknown };
  if (typeof parsed.prompt !== "string") {
    throw new Error("caveman-review.toml: missing prompt field");
  }
  cachedPrompt = parsed.prompt;
  return cachedPrompt;
}

export async function handleReview(_args: string, ctx: Ctx): Promise<void> {
  await ctx.sendUserMessage(loadReviewPrompt());
}
