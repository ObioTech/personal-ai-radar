import { describe, it, expect } from "vitest";
import { formatTelegramMessage } from "../src/delivery/telegram.js";
import { DailyResult } from "../src/types.js";

describe("Telegram delivery utility", () => {
  it("formats summary messages correctly", () => {
    const result: DailyResult = {
      date: "2026-06-10",
      selectedItems: [
        {
          contentHash: "hash1",
          sourceId: "src1",
          sourceName: "Source 1",
          sourceWeight: 1.0,
          title: "MCP Spec Updated",
          url: "https://test.com",
          publishedAt: "2026-06-10",
          summary: "Updated spec",
          slug: "mcp-spec-updated",
          normalizedAt: "2026-06-10",
          matchedKeywords: [],
          matchedCategories: [],
          prefilterScore: 1.0,
          rankScore: 1.0,
          decision: "ADOPT_NOW",
          relevanceReason: "",
          workflowConnection: "",
          skepticalNotes: "",
          suggestedAction: "",
          llmScore: 9,
          judgedAt: "2026-06-10"
        }
      ],
      totalCollected: 10,
      totalAfterDedupe: 5,
      totalAfterPrefilter: 2,
      ignoredCount: 9,
      noItemToday: false,
      generalNotes: "General info"
    };

    const message = formatTelegramMessage(result);
    expect(message).toContain("Obio Radar — 2026-06-10");
    expect(message).toContain("1. MCP Spec Updated — ÁP DỤNG NGAY ⚡");
    expect(message).toContain("docs/daily/2026-06-10.md");
  });

  it("handles empty signals correctly", () => {
    const result: DailyResult = {
      date: "2026-06-10",
      selectedItems: [],
      totalCollected: 0,
      totalAfterDedupe: 0,
      totalAfterPrefilter: 0,
      ignoredCount: 0,
      noItemToday: true,
      generalNotes: ""
    };

    const message = formatTelegramMessage(result);
    expect(message).toContain("Không có tín hiệu đáng chú ý hôm nay.");
  });
});
