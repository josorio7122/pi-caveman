import { describe, expect, it, vi } from "vitest";
import { handleCommit } from "./commit.js";

describe("handleCommit", () => {
  it("loads prompt from caveman-commit.toml and sends as user message", async () => {
    const sendUserMessage = vi.fn();
    await handleCommit("", { sendUserMessage } as never);
    expect(sendUserMessage).toHaveBeenCalledTimes(1);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("commit message");
    expect(text).toContain("Conventional Commits");
  });
});
