import { RawItem, CandidateItem } from "../types.js";
import { parseDate, nowISO } from "../utils/date.js";
import { sha256 } from "../utils/hash.js";
import { slugify, slugifyUrl } from "../utils/slug.js";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanUrl(url: string): string {
  let cleaned = url.trim();
  try {
    const parsed = new URL(cleaned);
    const host = parsed.host.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();
    let pathname = parsed.pathname;
    if (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    cleaned = `${protocol}//${host}${pathname}${parsed.search}${parsed.hash}`;
  } catch (e) {
    // Fallback if parsing fails
  }
  return cleaned;
}

export function normalizeItem(raw: RawItem): CandidateItem {
  const title = decodeHtmlEntities(raw.title.trim());
  const url = cleanUrl(raw.url);

  let summary = raw.summary.replace(/<[^>]+>/g, "").trim();
  summary = decodeHtmlEntities(summary);
  if (summary.length > 500) {
    summary = summary.substring(0, 500);
  }

  const publishedAt = parseDate(raw.publishedAt);
  const contentHash = sha256(url);
  const slug = slugify(title) || slugifyUrl(url);

  return {
    sourceId: raw.sourceId,
    sourceName: raw.sourceName,
    sourceWeight: raw.sourceWeight,
    title,
    url,
    publishedAt,
    summary,
    contentHash,
    slug,
    normalizedAt: nowISO(),
    matchedKeywords: [],
    matchedCategories: [],
    prefilterScore: 0,
    rankScore: 0,
  };
}

export function normalizeItems(rawItems: RawItem[]): CandidateItem[] {
  return rawItems.map(normalizeItem);
}
