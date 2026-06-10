import { CandidateItem, DiscardReason } from "../types.js";

export interface TopicsConfig {
  categories: Array<{ id: string; label: string; keywords: string[] }>;
  prefilter: { minScore: number; maxCandidatesForLLM: number };
  judge: { maxSelectedPerDay: number; minLLMScore: number };
}

export function prefilterItems(
  items: CandidateItem[],
  topics: TopicsConfig,
  options?: { verbose?: boolean }
): {
  shortlist: CandidateItem[];
  rejected: Array<{ item: CandidateItem; reason: DiscardReason }>;
} {
  const scoredItems: CandidateItem[] = [];
  const rejected: Array<{ item: CandidateItem; reason: DiscardReason }> = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary}`.toLowerCase();

    let maxCategoryScore = 0;
    const matchedKeywordsSet = new Set<string>();
    const matchedCategoriesSet = new Set<string>();

    for (const category of topics.categories) {
      let matchedInCategory = 0;
      for (const keyword of category.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          matchedInCategory++;
          matchedKeywordsSet.add(keyword);
          matchedCategoriesSet.add(category.id);
        }
      }
      if (category.keywords.length > 0) {
        const score = matchedInCategory / category.keywords.length;
        if (score > maxCategoryScore) {
          maxCategoryScore = score;
        }
      }
    }

    item.prefilterScore = maxCategoryScore;
    item.matchedKeywords = Array.from(matchedKeywordsSet);
    item.matchedCategories = Array.from(matchedCategoriesSet);
    item.rankScore = maxCategoryScore * item.sourceWeight;

    if (maxCategoryScore >= topics.prefilter.minScore) {
      scoredItems.push(item);
    } else {
      rejected.push({ item, reason: "keyword_miss" });
    }
  }

  // Sort by rank score in descending order
  scoredItems.sort((a, b) => b.rankScore - a.rankScore);

  const shortlist = scoredItems.slice(0, topics.prefilter.maxCandidatesForLLM);
  const capExceeded = scoredItems.slice(topics.prefilter.maxCandidatesForLLM);

  for (const item of capExceeded) {
    rejected.push({ item, reason: "cap_exceeded" });
  }

  if (options?.verbose) {
    console.log(
      `[PREFILTER] ${items.length} items → ${shortlist.length} candidates (after scoring, sort, cap)`
    );
    const missCount = rejected.filter((r) => r.reason === "keyword_miss").length;
    const capCount = rejected.filter((r) => r.reason === "cap_exceeded").length;
    console.log(
      `[PREFILTER] Rejected ${rejected.length}: ${missCount} keyword_miss, ${capCount} cap_exceeded`
    );
  }

  return { shortlist, rejected };
}
