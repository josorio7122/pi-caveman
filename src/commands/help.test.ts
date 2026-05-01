import { describe, expect, it, vi } from "vitest";
import { handleHelp } from "./help.js";

describe("handleHelp", () => {
  it("notifies with help skill body", async () => {
    const notify = vi.fn();
    await handleHelp("", { ui: { notify } } as never);
    expect(notify).toHaveBeenCalledTimes(1);
    const [text, level] = notify.mock.calls[0] ?? [];
    expect(text).toContain("Caveman Help");
    expect(text).toContain("/caveman");
    expect(level).toBe("info");
  });
});
