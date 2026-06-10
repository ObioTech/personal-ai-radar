import { describe, it, expect } from "vitest";
import { sha256 } from "../src/utils/hash.js";
import { slugify, slugifyUrl } from "../src/utils/slug.js";
import { todayISO, nowISO, parseDate, formatDisplayDate } from "../src/utils/date.js";

describe("hash utility", () => {
  it("generates consistent 64-char hex sha256", () => {
    const hash = sha256("https://example.com");
    expect(hash).toHaveLength(64);
    expect(sha256("https://example.com")).toBe(hash);
    expect(sha256("")).toHaveLength(64);
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});

describe("slug utility", () => {
  it("slugifies simple inputs", () => {
    expect(slugify("MCP Security Update 2026")).toBe("mcp-security-update-2026");
    expect(slugify("Context7: New RAG approach")).toBe("context7-new-rag-approach");
    expect(slugify("Playwright v1.45.0 Released")).toBe("playwright-v1-45-0-released");
  });

  it("normalizes Vietnamese characters", () => {
    expect(slugify("Đường đi khó, không khó vì ngăn sông cách núi")).toContain("duong-di-kho-khong-kho-vi-ngan-song-cach-nui");
  });

  it("handles empty and special inputs", () => {
    expect(slugify("")).toMatch(/^item-\d+$/);
    expect(slugify("你好世界")).toMatch(/^item-\d+$/);
  });

  it("truncates to 80 chars", () => {
    const longStr = "a".repeat(100);
    expect(slugify(longStr)).toHaveLength(80);
  });

  it("slugifies URL pathnames", () => {
    expect(slugifyUrl("https://example.com/blog/my-post.html")).toBe("my-post");
    expect(slugifyUrl("https://example.com/blog/my-post/")).toBe("my-post");
    expect(slugifyUrl("https://example.com")).toBe("https-example-com");
  });
});

describe("date utility", () => {
  it("gets today ISO date format", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses dates into ISO strings without throwing", () => {
    expect(parseDate("Mon, 10 Jun 2026 10:00:00 +0000")).toBe(new Date("Mon, 10 Jun 2026 10:00:00 +0000").toISOString());
    expect(parseDate("2026-06-10T10:00:00Z")).toBe("2026-06-10T10:00:00.000Z");
    expect(parseDate("invalid date")).toBe(parseDate("")); // Should fallback to current time
  });

  it("formats dates for display", () => {
    expect(formatDisplayDate("2026-06-10T00:00:00.000Z")).toBe("10 tháng 6, 2026");
  });
});
