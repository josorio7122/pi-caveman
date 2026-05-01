import { describe, expect, it, vi } from "vitest";
import { handleReview } from "./review.js";

describe("handleReview", () => {
  it("loads prompt from caveman-review.toml and sends as user message", async () => {
    const sendUserMessage = vi.fn();
    await handleReview("", { sendUserMessage } as never);
    const text = sendUserMessage.mock.calls[0]?.[0] as string;
    expect(text).toContain("Review");
    expect(text).toContain("L<line>");
  });
});
