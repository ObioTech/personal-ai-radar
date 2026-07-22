import { describe, it, expect, vi } from "vitest";
import { fetchRssFeed } from "../src/collectors/rss.js";
import { fetchGithubReleases } from "../src/collectors/github.js";
import {
  fetchHuggingFaceTrending,
  fetchHuggingFacePapers,
} from "../src/collectors/huggingface.js";
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

describe("Hugging Face Collector", () => {
  it("fetches Hugging Face trending models successfully", async () => {
    const mockHfModels = [
      {
        id: "vietnamese-ai/vi-tts-model",
        likes: 120,
        downloads: 5000,
        pipeline_tag: "text-to-speech",
        tags: ["text-to-speech", "vietnamese"],
        lastModified: "2026-07-20T00:00:00.000Z"
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockHfModels,
    });

    const source: Source = {
      id: "hf-trending-models",
      name: "HF Trending Models",
      type: "huggingface_trending",
      hfType: "model",
      enabled: true,
      tags: ["speech-tts-audio"],
      weight: 1.4
    };

    const items = await fetchHuggingFaceTrending(source);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toContain("vietnamese-ai/vi-tts-model");
    expect(items[0]?.url).toBe("https://huggingface.co/models/vietnamese-ai/vi-tts-model");
  });

  it("fetches Hugging Face daily papers successfully", async () => {
    const mockHfPapers = [
      {
        paper: {
          id: "2407.99999",
          title: "Vietnamese Voice Synthesis Transformer",
          summary: "A novel TTS architecture for low-resource languages.",
          authors: [{ name: "Nguyen Van A" }],
          publishedAt: "2026-07-21T00:00:00.000Z",
          upvotes: 42
        }
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockHfPapers,
    });

    const source: Source = {
      id: "hf-daily-papers",
      name: "HF Daily Papers",
      type: "huggingface_papers",
      enabled: true,
      tags: ["speech-tts-audio"],
      weight: 1.3
    };

    const items = await fetchHuggingFacePapers(source);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("[HF Paper] Vietnamese Voice Synthesis Transformer");
    expect(items[0]?.url).toBe("https://huggingface.co/papers/2407.99999");
  });
});

