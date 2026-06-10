import Parser from "rss-parser";
import { Source, RawItem } from "../types.js";
import { parseDate } from "../utils/date.js";
import { sha256 } from "../utils/hash.js";

export async function fetchRssFeed(source: Source): Promise<RawItem[]> {
  if (!source.url) {
    throw new Error(`Missing URL for RSS source: ${source.id}`);
  }

  const parser = new Parser();

  // 10s Timeout wrapper
  const fetchPromise = parser.parseURL(source.url);
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout fetching RSS feed: ${source.id}`));
    }, 10000);
    // Unref timer if running in Node to allow graceful exit
    if (timer.unref) timer.unref();
  });

  const feed = await Promise.race([fetchPromise, timeoutPromise]);

  const rawItems: RawItem[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const item of feed.items) {
    const url = item.link ?? item.guid;
    if (!url) {
      console.warn(`[WARN] Skipping item without URL in feed ${source.id}`);
      continue;
    }

    const title = item.title ?? url ?? "Untitled";
    const summary = (item.contentSnippet ?? item.content ?? item.summary ?? "").substring(0, 500);
    const pubDateStr = item.pubDate ?? item.isoDate ?? "";
    const publishedAt = parseDate(pubDateStr);
    const itemDate = new Date(publishedAt);

    if (itemDate >= sevenDaysAgo) {
      rawItems.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceWeight: source.weight,
        title,
        url,
        publishedAt,
        summary,
        contentHash: sha256(url),
      });
    }
  }

  return rawItems;
}
