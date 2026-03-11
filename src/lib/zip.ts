import AdmZip from "adm-zip";

const ERROR_KEYWORDS = ["error", "exception", "failed"];

function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "txt" || ext === "log" || ext === "" || name.toLowerCase().endsWith(".log");
}

export function extractTextFromZipBuffer(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const parts: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory || entry.entryName.length === 0) continue;
    const name = entry.entryName.split("/").pop() ?? entry.entryName;
    if (!isTextFile(name)) continue;
    const content = entry.getData().toString("utf8");
    parts.push(`[${entry.entryName}]`);
    parts.push(content);
  }

  return parts.join("\n");
}

export function extractErrorLines(fullLog: string): string {
  if (!fullLog?.trim()) return "";
  const lines = fullLog.split(/\r?\n/).filter((l) => l.trim());
  const errorLines = lines.filter((line) =>
    ERROR_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))
  );
  return errorLines.join("\n");
}
