import { describe, expect, it, vi } from "vitest";
import { buildHandleHelp } from "./help.js";

describe("buildHandleHelp", () => {
  it("sends the /caveman-help trigger phrase to pi.sendUserMessage", async () => {
    const sendUserMessage = vi.fn();
    const handler = buildHandleHelp({ sendUserMessage });
    await handler("", {});
    expect(sendUserMessage).toHaveBeenCalledTimes(1);
    expect(sendUserMessage).toHaveBeenCalledWith("/caveman-help");
  });
});
