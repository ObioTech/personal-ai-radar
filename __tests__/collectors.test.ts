import { describe, it, expect, vi } from "vitest";
import { fetchRssFeed } from "../src/collectors/rss.js";
import { fetchGithubReleases } from "../src/collectors/github.js";
import { Source } from "../src/types.js";

vi.mock("rss-parser", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        parseURL: vi.fn().mockResolvedValue({
          items: [
            {
              title: "Test Feed Item",
              link: "https://testfeed.com/item1",
              contentSnippet: "Snippet content for item",
              isoDate: new Date().toISOString()
            }
          ]
        })
      };
    })
  };
});

describe("RSS Feed Collector", () => {
  it("fetches and parses feed successfully", async () => {
    const source: Source = {
      id: "test-rss",
      name: "Test RSS",
      type: "rss",
      url: "https://mock-rss.com/feed",
      enabled: true,
      tags: [],
      weight: 1.0
    };
    const items = await fetchRssFeed(source);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Test Feed Item");
    expect(items[0]?.url).toBe("https://testfeed.com/item1");
  });
});

describe("GitHub Releases Collector", () => {
  it("fetches and strips markdown successfully", async () => {
    const mockReleases = [
      {
        draft: false,
        prerelease: false,
        name: "Release v1.0.0",
        html_url: "https://github.com/mock/repo/releases/v1.0.0",
        body: "# Big Header\n- Bullet point\nSome **bold** and `code` info.",
        published_at: new Date().toISOString()
      }
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockReleases,
      headers: {
        get: () => "60"
      }
    });

    global.fetch = mockFetch;

    const source: Source = {
      id: "test-github",
      name: "Test GitHub",
      type: "github_releases",
      repo: "mock/repo",
      enabled: true,
      tags: [],
      weight: 1.2
    };

    const items = await fetchGithubReleases(source, "dummy-token");
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Release v1.0.0");
    expect(items[0]?.summary).toBe("Big Header Bullet point Some bold and code info.");
  });
});
