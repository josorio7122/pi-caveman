import { extractUsage, type Usage } from "./extract-usage.js";

export type Totals = Usage & { readonly messages: number };

export function parseSessionTotals(jsonl: string): Totals {
  const lines = jsonl.split("\n");
  return lines.reduce<Totals>(
    (acc, line) => {
      if (!line) return acc;
      try {
        const u = extractUsage(JSON.parse(line));
        if (!u) return acc;
        return {
          input: acc.input + u.input,
          output: acc.output + u.output,
          cacheRead: acc.cacheRead + u.cacheRead,
          cacheWrite: acc.cacheWrite + u.cacheWrite,
          messages: acc.messages + 1,
        };
      } catch {
        return acc;
      }
    },
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, messages: 0 },
  );
}
