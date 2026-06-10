import { describe, it, expect } from "vitest";
import { renderReportMarkdown } from "../src/pipeline/renderReport.js";
import { CandidateItem } from "../src/types.js";

describe("deep-dive report renderer", () => {
  it("renders report with frontmatter and correctly formatted sections", () => {
    const item: CandidateItem = {
      contentHash: "hash123",
      sourceId: "src",
      sourceName: "Source",
      sourceWeight: 1.0,
      title: "Clean Code",
      url: "https://example.com/clean-code",
      publishedAt: "2026-06-10",
      summary: "This is summary",
      slug: "clean-code",
      normalizedAt: "2026-06-10",
      matchedKeywords: ["mcp"],
      matchedCategories: ["mcp-server"],
      prefilterScore: 1.0,
      rankScore: 1.0
    };

    const reportContent = "## 1. Nó là gì?\nĐây là công cụ sạch.";
    const markdown = renderReportMarkdown(item, reportContent, "clean-code");

    expect(markdown).toContain('title: "Clean Code"');
    expect(markdown).toContain('slug: "clean-code"');
    expect(markdown).toContain("- mcp-server");
    expect(markdown).toContain("Đây là công cụ sạch.");
  });
});
