import { handleCaveman } from "./caveman.js";
import { buildHandleCommit } from "./commit.js";
import { buildHandleHelp } from "./help.js";
import { handleInit } from "./init.js";
import { buildHandleReview } from "./review.js";
import { handleStats } from "./stats.js";

type CommandSpec = {
  description: string;
  handler: (args: string, ctx: unknown) => Promise<void>;
};

type ExtensionAPI = {
  registerCommand: (name: string, spec: CommandSpec) => void;
  sendUserMessage: (text: string) => void | Promise<void>;
};

export function registerCommands(pi: ExtensionAPI): void {
  pi.registerCommand("caveman", {
    description: "switch caveman mode (lite/full/ultra/wenyan*/off)",
    handler: handleCaveman as never,
  });
  pi.registerCommand("caveman-commit", {
    description: "generate a terse caveman-style commit message",
    handler: buildHandleCommit(pi) as never,
  });
  pi.registerCommand("caveman-review", {
    description: "one-line caveman-style code review comments",
    handler: buildHandleReview(pi) as never,
  });
  pi.registerCommand("caveman-init", {
    description: "drop the always-on caveman activation rule into the current repo",
    handler: handleInit as never,
  });
  pi.registerCommand("caveman-stats", {
    description: "show real token usage and savings for current session",
    handler: handleStats as never,
  });
  pi.registerCommand("caveman-help", {
    description: "quick-reference card for caveman modes and commands",
    handler: buildHandleHelp(pi) as never,
  });
}
