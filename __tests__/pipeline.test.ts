import { describe, it, expect } from "vitest";
import { normalizeItem } from "../src/pipeline/normalize.js";
import { prefilterItems, TopicsConfig } from "../src/pipeline/prefilter.js";
import { RawItem, CandidateItem } from "../src/types.js";

describe("normalization stage", () => {
  it("cleans title, url, summary and computes fields", () => {
    const raw: RawItem = {
      sourceId: "src-1",
      sourceName: "Source 1",
      sourceWeight: 1.5,
      title: "  Hello &amp; Welcome &lt;MCP&gt;  ",
      url: "HTTPS://EXAMPLE.COM/Path/With/Slash/",
      publishedAt: "2026-06-10T10:00:00Z",
      summary: "<p>This is a <b>summary</b> with entities like &quot;quotes&quot;</p>"
    };

    const normalized = normalizeItem(raw);
    expect(normalized.title).toBe("Hello & Welcome <MCP>");
    expect(normalized.url).toBe("https://example.com/Path/With/Slash");
    expect(normalized.summary).toBe("This is a summary with entities like \"quotes\"");
    expect(normalized.contentHash).toHaveLength(64);
    expect(normalized.slug).toBe("hello-welcome-mcp");
    expect(normalized.sourceWeight).toBe(1.5);
  });
});

describe("prefilter stage", () => {
  it("scores and categories are matched correctly", () => {
    const items: CandidateItem[] = [
      {
        contentHash: "h1",
        sourceId: "src-1",
        sourceName: "Source 1",
        sourceWeight: 1.0,
        title: "Introduction to MCP servers",
        url: "https://url1.com",
        publishedAt: "2026-06-10",
        summary: "This article is about model context protocol specification.",
        slug: "intro-mcp",
        normalizedAt: "2026-06-10",
        matchedKeywords: [],
        matchedCategories: [],
        prefilterScore: 0,
        rankScore: 0
      },
      {
        contentHash: "h2",
        sourceId: "src-1",
        sourceName: "Source 1",
        sourceWeight: 1.0,
        title: "Random news article",
        url: "https://url2.com",
        publishedAt: "2026-06-10",
        summary: "Nothing relevant to developer productivity in this feed item.",
        slug: "random-news",
        normalizedAt: "2026-06-10",
        matchedKeywords: [],
        matchedCategories: [],
        prefilterScore: 0,
        rankScore: 0
      }
    ];

    const topics: TopicsConfig = {
      categories: [
        {
          id: "mcp-server",
          label: "MCP",
          keywords: ["mcp", "model context protocol"]
        }
      ],
      prefilter: {
        minScore: 0.3,
        maxCandidatesForLLM: 15
      },
      judge: {
        maxSelectedPerDay: 5,
        minLLMScore: 5
      }
    };

    const { shortlist, rejected } = prefilterItems(items, topics);
    expect(shortlist).toHaveLength(1);
    expect(shortlist[0]?.contentHash).toBe("h1");
    expect(shortlist[0]?.prefilterScore).toBe(1.0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.item.contentHash).toBe("h2");
    expect(rejected[0]?.reason).toBe("keyword_miss");
  });
});
