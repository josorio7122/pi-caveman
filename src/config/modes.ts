import { type Static, Type } from "@sinclair/typebox";

export const VALID_MODES = [
  "off",
  "lite",
  "full",
  "ultra",
  "wenyan-lite",
  "wenyan",
  "wenyan-full",
  "wenyan-ultra",
  "commit",
  "review",
  "compress",
] as const;

export type Mode = (typeof VALID_MODES)[number];
export type ModeLabel = Exclude<Mode, "wenyan">;

export const ModeSchema = Type.Union(VALID_MODES.map((m) => Type.Literal(m)));
export type ModeT = Static<typeof ModeSchema>;

export const INDEPENDENT_MODES: ReadonlySet<Mode> = new Set(["commit", "review", "compress"]);

export function isValidMode(value: string): value is Mode {
  return (VALID_MODES as readonly string[]).includes(value.toLowerCase());
}

export function modeLabel(mode: Mode): ModeLabel {
  return mode === "wenyan" ? "wenyan-full" : mode;
}
