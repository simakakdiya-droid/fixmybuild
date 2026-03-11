import type { AIAnalysis } from "@/types/pipeline";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const apiKey = process.env.OPENAI_API_KEY ?? "";

const SYSTEM_PROMPT = `You are a senior DevOps engineer specializing in CI/CD troubleshooting.

Analyze the provided pipeline logs carefully and determine the actual root cause of failure.

Focus on:
* build errors
* dependency issues
* test failures
* configuration errors
* infrastructure issues
* missing environment variables
* authentication or permission issues

Ignore warnings unless they directly cause the failure.

Return structured JSON in this format only (no markdown, no code fence, no text outside JSON):

{
  "failed_stage": "",
  "error_summary": "",
  "root_cause": "",
  "category": "code | dependency | configuration | infrastructure | test",
  "fix_suggestion": "",
  "key_error_lines": [],
  "severity": "low | medium | high",
  "confidence": 0
}

Rules:
* Output valid JSON only
* Do not include explanations outside JSON
* Extract the most relevant error lines from the log into key_error_lines (array of strings)
* Provide actionable fix suggestions
* failed_stage: the pipeline step that failed (e.g. Build, Test, Deploy)
* confidence: number 0-100`;

function extractJson(content: string): string {
  let trimmed = content.trim();
  // Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) trimmed = codeFenceMatch[1].trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

function safeParseAnalysis(jsonBlock: string): AIAnalysis | null {
  try {
    const parsed = JSON.parse(jsonBlock) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      failed_stage: String(parsed.failed_stage ?? ""),
      error_summary: String(parsed.error_summary ?? ""),
      root_cause: String(parsed.root_cause ?? ""),
      category: String(parsed.category ?? "configuration"),
      fix_suggestion: String(parsed.fix_suggestion ?? ""),
      key_error_lines: Array.isArray(parsed.key_error_lines)
        ? (parsed.key_error_lines as string[]).map(String)
        : [],
      severity: String(parsed.severity ?? "medium"),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence) || 0,
    };
  } catch {
    // Try fixing trailing commas (replace ,] with ], ,} with })
    const fixed = jsonBlock.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
    try {
      const parsed = JSON.parse(fixed) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object") return null;
      return {
        failed_stage: String(parsed.failed_stage ?? ""),
        error_summary: String(parsed.error_summary ?? ""),
        root_cause: String(parsed.root_cause ?? ""),
        category: String(parsed.category ?? "configuration"),
        fix_suggestion: String(parsed.fix_suggestion ?? ""),
        key_error_lines: Array.isArray(parsed.key_error_lines)
          ? (parsed.key_error_lines as string[]).map(String)
          : [],
        severity: String(parsed.severity ?? "medium"),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence) || 0,
      };
    } catch {
      return null;
    }
  }
}

export async function analyzeLogs(logText: string): Promise<AIAnalysis | null> {
  if (!apiKey) return null;
  const userContent = `Pipeline error log to analyze:\n\n${logText}`;
  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  };
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API: ${res.status} ${errText}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  const jsonBlock = extractJson(content);
  if (!jsonBlock || jsonBlock.length < 2) return null;
  const result = safeParseAnalysis(jsonBlock);
  if (!result && process.env.NODE_ENV === "development") {
    console.error("[groq] Failed to parse AI response. Raw content (first 500 chars):", content.slice(0, 500));
  }
  return result;
}
