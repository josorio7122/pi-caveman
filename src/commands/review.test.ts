import { describe, expect, it, vi } from "vitest";
import { buildHandleReview } from "./review.js";

describe("buildHandleReview", () => {
  it("sends the upstream caveman-review toml prompt to pi.sendUserMessage", async () => {
    const sendUserMessage = vi.fn();
    const handler = buildHandleReview({ sendUserMessage });
    await handler("", {});
    expect(sendUserMessage).toHaveBeenCalledTimes(1);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("Review");
    expect(text).toContain("L<line>");
  });
});
