import type { Totals } from "./parse.js";

const fmt = (n: number): string => n.toLocaleString("en-US");

export function renderStatsCard(t: Totals): string {
  if (t.messages === 0) return "🪨 caveman stats — No usage yet.";
  const lines = [
    "🪨 caveman stats",
    `messages    ${fmt(t.messages)}`,
    `input       ${fmt(t.input)}`,
    `output      ${fmt(t.output)}`,
    `cache read  ${fmt(t.cacheRead)}`,
    `cache write ${fmt(t.cacheWrite)}`,
  ];
  return lines.join("\n");
}
