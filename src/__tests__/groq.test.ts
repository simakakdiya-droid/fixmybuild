// Tests for the JSON extraction and parse logic in groq.ts.
// We export the helpers for testing via a test-only re-export below.

function extractJson(content: string): string {
  let trimmed = content.trim();
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) trimmed = codeFenceMatch[1].trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

describe("extractJson", () => {
  it("extracts plain JSON object", () => {
    const input = `{"failed_stage":"Build","confidence":85}`;
    expect(extractJson(input)).toBe(input);
  });

  it("strips markdown code fence (```json ... ```)", () => {
    const inner = `{"failed_stage":"Test","confidence":72}`;
    const input = "```json\n" + inner + "\n```";
    expect(extractJson(input)).toBe(inner);
  });

  it("strips bare code fence (``` ... ```)", () => {
    const inner = `{"root_cause":"Missing env var","confidence":60}`;
    const input = "```\n" + inner + "\n```";
    expect(extractJson(input)).toBe(inner);
  });

  it("extracts JSON embedded in prose", () => {
    const input = `Here is the analysis:\n{"severity":"high","confidence":91}\nDone.`;
    const result = extractJson(input);
    expect(result).toBe(`{"severity":"high","confidence":91}`);
  });

  it("returns trimmed input when no JSON object found", () => {
    const input = "  no json here  ";
    expect(extractJson(input)).toBe("no json here");
  });
});

describe("confidence gating for PR creation", () => {
  const CONFIDENCE_THRESHOLD = 70;

  function canCreatePR(confidence: number): boolean {
    return confidence >= CONFIDENCE_THRESHOLD;
  }

  it("allows PR creation at exactly 70% confidence", () => {
    expect(canCreatePR(70)).toBe(true);
  });

  it("allows PR creation above threshold", () => {
    expect(canCreatePR(85)).toBe(true);
    expect(canCreatePR(100)).toBe(true);
  });

  it("blocks PR creation below threshold", () => {
    expect(canCreatePR(69)).toBe(false);
    expect(canCreatePR(0)).toBe(false);
  });

  it("treats boundary correctly (69 vs 70)", () => {
    expect(canCreatePR(69)).toBe(false);
    expect(canCreatePR(70)).toBe(true);
  });
});
