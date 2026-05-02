import { handleCaveman } from "./caveman.js";
import { handleCommit } from "./commit.js";
import { handleInit } from "./init.js";
import { handleReview } from "./review.js";
import { handleStats } from "./stats.js";

type CommandSpec = {
  description: string;
  handler: (args: string, ctx: unknown) => Promise<void>;
};

type ExtensionAPI = {
  registerCommand: (name: string, spec: CommandSpec) => void;
};

export function registerCommands(pi: ExtensionAPI): void {
  pi.registerCommand("caveman", {
    description: "switch caveman mode (lite/full/ultra/wenyan*/off)",
    handler: handleCaveman as never,
  });
  pi.registerCommand("caveman-commit", {
    description: "generate terse caveman-style commit message",
    handler: handleCommit as never,
  });
  pi.registerCommand("caveman-review", {
    description: "one-line caveman code review comments",
    handler: handleReview as never,
  });
  pi.registerCommand("caveman-init", {
    description: "drop the always-on caveman activation rule into the current repo",
    handler: handleInit as never,
  });
  pi.registerCommand("caveman-stats", {
    description: "show real token usage and savings for current session",
    handler: handleStats as never,
  });
}
