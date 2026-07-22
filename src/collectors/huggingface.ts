import { Source, RawItem } from "../types.js";
import { sha256 } from "../utils/hash.js";

interface HfModelItem {
  id: string;
  pipeline_tag?: string;
  tags?: string[];
  likes?: number;
  downloads?: number;
  lastModified?: string;
}

interface HfSpaceItem {
  id: string;
  sdk?: string;
  likes?: number;
  lastModified?: string;
}

interface HfPaperEntry {
  paper: {
    id: string;
    title: string;
    summary?: string;
    authors?: Array<{ name: string }>;
    publishedAt?: string;
    upvotes?: number;
  };
}

export async function fetchHuggingFaceTrending(
  source: Source,
  options?: { verbose?: boolean }
): Promise<RawItem[]> {
  const hfType = source.hfType || "model";
  const limit = 15;
  
  // Primary endpoint: models or spaces sorted by trending score
  const url = hfType === "space"
    ? `https://huggingface.co/api/spaces?sort=trendingScore&direction=-1&limit=${limit}`
    : `https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=${limit}`;

  const headers: Record<string, string> = {
    "User-Agent": "obio-radar/0.1.0 (https://github.com/obiotech/obio-radar)",
    "Accept": "application/json"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HuggingFaceError: HTTP ${response.status} when fetching ${hfType}s`);
    }

    const items = (await response.json()) as any[];
    const rawItems: RawItem[] = [];

    for (const item of items) {
      if (!item || !item.id) continue;

      const itemId = item.id;
      const isSpace = hfType === "space";
      const itemUrl = isSpace
        ? `https://huggingface.co/spaces/${itemId}`
        : `https://huggingface.co/models/${itemId}`;

      let title = `${isSpace ? "[HF Space]" : "[HF Model]"} ${itemId}`;
      const tagsList: string[] = Array.isArray(item.tags) ? item.tags : [];
      const pipelineTag = item.pipeline_tag || (tagsList.length > 0 ? tagsList.slice(0, 3).join(", ") : "");
      
      const likesStr = item.likes != null ? `Likes: ${item.likes}` : "";
      const downloadsStr = item.downloads != null ? `Downloads: ${item.downloads}` : "";
      const metaInfo = [pipelineTag, likesStr, downloadsStr].filter(Boolean).join(" | ");

      const summary = `${title}${metaInfo ? ` — ${metaInfo}` : ""}. Tags: ${tagsList.slice(0, 6).join(", ")}`;
      const publishedAt = item.lastModified || new Date().toISOString();

      rawItems.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceWeight: source.weight,
        title,
        url: itemUrl,
        publishedAt,
        summary: summary.substring(0, 500),
        contentHash: sha256(itemUrl),
      });
    }

    return rawItems;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (options?.verbose) {
      console.warn(`[WARN] Failed to fetch Hugging Face trending ${hfType}s: ${e.message}`);
    }
    throw e;
  }
}

export async function fetchHuggingFacePapers(
  source: Source,
  options?: { verbose?: boolean }
): Promise<RawItem[]> {
  const url = "https://huggingface.co/api/daily_papers";

  const headers: Record<string, string> = {
    "User-Agent": "obio-radar/0.1.0 (https://github.com/obiotech/obio-radar)",
    "Accept": "application/json"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HuggingFaceError: HTTP ${response.status} when fetching daily papers`);
    }

    const papersData = (await response.json()) as HfPaperEntry[];
    const rawItems: RawItem[] = [];

    for (const entry of papersData) {
      if (!entry || !entry.paper || !entry.paper.id) continue;

      const p = entry.paper;
      const paperUrl = `https://huggingface.co/papers/${p.id}`;
      const title = `[HF Paper] ${p.title}`;
      const authorsStr = p.authors ? p.authors.slice(0, 3).map((a) => a.name).join(", ") : "";
      const upvotesStr = p.upvotes != null ? `Upvotes: ${p.upvotes}` : "";

      const rawSummary = `${p.summary || ""}${authorsStr ? ` (Authors: ${authorsStr})` : ""}${upvotesStr ? ` [${upvotesStr}]` : ""}`;
      const publishedAt = p.publishedAt || new Date().toISOString();

      rawItems.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceWeight: source.weight,
        title,
        url: paperUrl,
        publishedAt,
        summary: rawSummary.substring(0, 500),
        contentHash: sha256(paperUrl),
      });
    }

    return rawItems;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (options?.verbose) {
      console.warn(`[WARN] Failed to fetch Hugging Face daily papers: ${e.message}`);
    }
    throw e;
  }
}
