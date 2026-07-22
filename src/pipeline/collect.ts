import { Source, RawItem, AppConfig } from "../types.js";
import { fetchRssFeed } from "../collectors/rss.js";
import { fetchGithubReleases } from "../collectors/github.js";
import {
  fetchHuggingFaceTrending,
  fetchHuggingFacePapers,
} from "../collectors/huggingface.js";

export async function collectAll(
  sources: Source[],
  config: AppConfig,
  options?: { verbose?: boolean }
): Promise<RawItem[]> {
  const enabledSources = sources.filter((s) => s.enabled);
  const promises = enabledSources.map(async (source) => {
    try {
      if (options?.verbose) {
        console.log(`[COLLECT] Fetching ${source.id} (${source.type})...`);
      }
      let items: RawItem[] = [];
      if (source.type === "rss") {
        items = await fetchRssFeed(source);
      } else if (source.type === "github_releases") {
        items = await fetchGithubReleases(source, config.githubToken, options);
      } else if (source.type === "huggingface_trending") {
        items = await fetchHuggingFaceTrending(source, options);
      } else if (source.type === "huggingface_papers") {
        items = await fetchHuggingFacePapers(source, options);
      }
      if (options?.verbose) {
        console.log(`[COLLECT] Fetched ${items.length} items from ${source.id}`);
      }
      return items;
    } catch (e: any) {
      console.warn(`[WARN] Failed to collect from ${source.id}: ${e.message}`);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
