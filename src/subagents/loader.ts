import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

export type AgentFrontmatter = Readonly<{
  name: string;
  description: string;
  model?: string;
  tools?: ReadonlyArray<string>;
}>;

export type AgentFile = Readonly<{
  filePath: string;
  frontmatter: AgentFrontmatter;
  body: string;
}>;

export type LoaderDiagnostic = Readonly<{
  level: "warn" | "error";
  filePath: string;
  message: string;
}>;

export type LoaderResult = Readonly<{
  files: ReadonlyArray<AgentFile>;
  diagnostics: ReadonlyArray<LoaderDiagnostic>;
}>;

function parseFrontmatter(raw: Record<string, unknown>): AgentFrontmatter | null {
  if (typeof raw.name !== "string" || typeof raw.description !== "string") return null;
  const tools = Array.isArray(raw.tools) ? raw.tools.filter((t): t is string => typeof t === "string") : undefined;
  return {
    name: raw.name,
    description: raw.description,
    ...(typeof raw.model === "string" ? { model: raw.model } : {}),
    ...(tools ? { tools } : {}),
  };
}

export async function loadAgentFiles(dir: string): Promise<LoaderResult> {
  const entries = await readdir(dir).catch(() => null);
  if (entries === null) {
    return {
      files: [],
      diagnostics: [{ level: "warn", filePath: dir, message: "agents dir missing" }],
    };
  }
  const mds = entries.filter((e) => e.endsWith(".md"));
  const results = await Promise.all(
    mds.map(async (entry): Promise<{ file?: AgentFile; diag?: LoaderDiagnostic }> => {
      const filePath = join(dir, entry);
      try {
        const raw = await readFile(filePath, "utf8");
        const parsed = matter(raw);
        const fm = parseFrontmatter(parsed.data);
        if (!fm) {
          return { diag: { level: "error", filePath, message: "missing name/description in frontmatter" } };
        }
        const toolsField = (parsed.data as { tools?: unknown }).tools;
        const tools =
          typeof toolsField === "string"
            ? toolsField
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : fm.tools;
        const fmFinal: AgentFrontmatter = tools ? { ...fm, tools } : fm;
        return { file: { filePath, frontmatter: fmFinal, body: parsed.content.trim() } };
      } catch (e) {
        return { diag: { level: "error", filePath, message: `parse failed: ${(e as Error).message}` } };
      }
    }),
  );
  const files = results.flatMap((r) => (r.file ? [r.file] : []));
  const diagnostics = results.flatMap((r) => (r.diag ? [r.diag] : []));
  return { files, diagnostics };
}
