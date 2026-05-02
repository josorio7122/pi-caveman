type PiSender = { sendUserMessage: (text: string) => void | Promise<void> };

export function buildHandleHelp(pi: PiSender) {
  return async (_args: string, _ctx: unknown): Promise<void> => {
    await pi.sendUserMessage("/caveman-help");
  };
}
