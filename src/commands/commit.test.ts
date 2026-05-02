import { describe, expect, it, vi } from "vitest";
import { buildHandleCommit } from "./commit.js";

describe("buildHandleCommit", () => {
  it("sends the upstream caveman-commit toml prompt to pi.sendUserMessage", async () => {
    const sendUserMessage = vi.fn();
    const handler = buildHandleCommit({ sendUserMessage });
    await handler("", {});
    expect(sendUserMessage).toHaveBeenCalledTimes(1);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("commit message");
    expect(text).toContain("Conventional Commits");
  });
});
