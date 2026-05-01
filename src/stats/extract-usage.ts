export type Usage = {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
};

type RawUsage = { input?: number; output?: number; cacheRead?: number; cacheWrite?: number };

export function extractUsage(entry: unknown): Usage | null {
  if (typeof entry !== "object" || entry === null) return null;
  const e = entry as { type?: unknown; message?: unknown };
  if (e.type !== "message" || typeof e.message !== "object" || e.message === null) return null;
  const m = e.message as { usage?: unknown };
  if (typeof m.usage !== "object" || m.usage === null) return null;
  const u = m.usage as RawUsage;
  return {
    input: u.input ?? 0,
    output: u.output ?? 0,
    cacheRead: u.cacheRead ?? 0,
    cacheWrite: u.cacheWrite ?? 0,
  };
}
