import { describe, it, expect, vi } from "vitest";
import { judgeItems, generateDailySummary } from "../src/pipeline/judge.js";
import { CandidateItem } from "../src/types.js";
import { LLMProvider } from "../src/llm/types.js";

describe("LLM judge pipeline step", () => {
  it("judges items successfully using mocked LLM response", async () => {
    const mockProvider: LLMProvider = {
      generateText: vi.fn().mockResolvedValue(
        JSON.stringify([
          {
            id: "hash123",
            decision: "SPIKE",
            relevanceReason: "Rat thu vi",
            workflowConnection: "Tool automation",
            skepticalNotes: "Hoi phuc tap",
            suggestedAction: "Nghien cuu",
            translatedSummary: "Tom tat tieng Viet",
            llmScore: 8
          }
        ])
      )
    };

    const shortlist: CandidateItem[] = [
      {
        contentHash: "hash123",
        sourceId: "src",
        sourceName: "Source",
        sourceWeight: 1.0,
        title: "Test title",
        url: "https://test.com",
        publishedAt: "2026-06-10",
        summary: "Summary content",
        slug: "test-title",
        normalizedAt: "2026-06-10",
        matchedKeywords: [],
        matchedCategories: [],
        prefilterScore: 1.0,
        rankScore: 1.0
      }
    ];

    const result = await judgeItems(mockProvider, shortlist, "Template {{SHORTLIST_JSON}}");
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.decision).toBe("SPIKE");
    expect(result.selected[0]?.llmScore).toBe(8);
    expect(result.ignored).toHaveLength(0);
  });

  it("handles retry and fallback if first try fails", async () => {
    const mockProvider: LLMProvider = {
      generateText: vi
        .fn()
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValueOnce(
          JSON.stringify([
            {
              id: "hash123",
              decision: "WATCH",
              relevanceReason: "Nen theo doi",
              workflowConnection: "Tooling",
              skepticalNotes: "Chua lam gi",
              suggestedAction: "",
              translatedSummary: "Tom tat",
              llmScore: 6
            }
          ])
        )
    };

    const shortlist: CandidateItem[] = [
      {
        contentHash: "hash123",
        sourceId: "src",
        sourceName: "Source",
        sourceWeight: 1.0,
        title: "Test title",
        url: "https://test.com",
        publishedAt: "2026-06-10",
        summary: "Summary content",
        slug: "test-title",
        normalizedAt: "2026-06-10",
        matchedKeywords: [],
        matchedCategories: [],
        prefilterScore: 1.0,
        rankScore: 1.0
      }
    ];

    const result = await judgeItems(mockProvider, shortlist, "Template {{SHORTLIST_JSON}}", {
      verbose: true,
    });
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.decision).toBe("WATCH");
  });
});
