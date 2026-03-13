import { extractErrorLines } from "@/lib/zip";

describe("extractErrorLines", () => {
  it("returns empty string for empty input", () => {
    expect(extractErrorLines("")).toBe("");
    expect(extractErrorLines("   ")).toBe("");
  });

  it("extracts lines containing 'error'", () => {
    const log = [
      "Starting build...",
      "error: module not found",
      "Build succeeded",
      "FAILED: test suite crashed",
    ].join("\n");

    const result = extractErrorLines(log);
    expect(result).toContain("error: module not found");
    expect(result).toContain("FAILED: test suite crashed");
    expect(result).not.toContain("Starting build...");
    expect(result).not.toContain("Build succeeded");
  });

  it("matches error keywords case-insensitively", () => {
    // "ERROR:" → matches "error", "Exception" → matches "exception"
    // "npm ERR!" does NOT contain the full word "error" so it won't match
    const log = "ERROR: something went wrong\nException in thread main\nnpm ERR! code ENOENT";
    const result = extractErrorLines(log);
    expect(result.split("\n").length).toBe(2);
    expect(result).toContain("ERROR: something went wrong");
    expect(result).toContain("Exception in thread main");
  });

  it("filters out blank lines", () => {
    const log = "\n\nerror: bad\n\n";
    const result = extractErrorLines(log);
    expect(result).toBe("error: bad");
  });

  it("returns all lines when every line matches", () => {
    const log = "error 1\nfailed test\nexception caught";
    const result = extractErrorLines(log);
    expect(result.split("\n")).toHaveLength(3);
  });
});
