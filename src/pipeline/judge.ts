import { z } from "zod";
import { LLMProvider } from "../llm/types.js";
import { CandidateItem, JudgedItem, DiscardReason, DecisionLabel } from "../types.js";
import { nowISO } from "../utils/date.js";

const JudgeResultSchema = z.object({
  id: z.string(),
  decision: z.enum(["ADOPT_NOW", "SPIKE", "WATCH", "IGNORE", "BLOCKED_BY_RISK", "UNKNOWN"]),
  relevanceReason: z.string().min(1),
  workflowConnection: z.string().min(1),
  skepticalNotes: z.string().min(1),
  suggestedAction: z.string().default(""),
  llmScore: z.number().min(0).max(10),
});

const JudgeResponseSchema = z.array(JudgeResultSchema);

function toJudgeInput(item: CandidateItem) {
  return {
    id: item.contentHash,
    title: item.title,
    url: item.url,
    summary: item.summary,
    matchedCategories: item.matchedCategories,
    sourceId: item.sourceId,
    publishedAt: item.publishedAt,
  };
}

export async function judgeItems(
  provider: LLMProvider,
  shortlist: CandidateItem[],
  promptTemplate: string,
  options?: { verbose?: boolean; minLLMScore?: number; maxSelectedPerDay?: number }
): Promise<{
  selected: JudgedItem[];
  ignored: Array<{ item: CandidateItem; reason: DiscardReason }>;
}> {
  const minLLMScore = options?.minLLMScore ?? 5;
  const maxSelectedPerDay = options?.maxSelectedPerDay ?? 5;

  if (shortlist.length === 0) {
    return { selected: [], ignored: [] };
  }

  const inputJson = JSON.stringify(shortlist.map(toJudgeInput), null, 2);
  const prompt = promptTemplate.replace("{{SHORTLIST_JSON}}", inputJson);

  let rawResponse = "";
  let parsedResults: any[] = [];
  let success = false;

  try {
    rawResponse = await provider.generateText(prompt, { jsonMode: true });
    parsedResults = JSON.parse(rawResponse);
    JudgeResponseSchema.parse(parsedResults);
    success = true;
  } catch (e: any) {
    if (options?.verbose) {
      console.warn(`[JUDGE] First attempt failed: ${e.message}. Retrying in 2 seconds...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const retryPrompt = `${prompt}\n\nFix the JSON. Return only a valid JSON array matching the schema.`;
      rawResponse = await provider.generateText(retryPrompt, { jsonMode: true });
      parsedResults = JSON.parse(rawResponse);
      JudgeResponseSchema.parse(parsedResults);
      success = true;
    } catch (retryErr: any) {
      console.error(`[ERROR] LLM judge failed after retry: ${retryErr.message}`);
    }
  }

  const selected: JudgedItem[] = [];
  const ignored: Array<{ item: CandidateItem; reason: DiscardReason }> = [];
  const judgedAt = nowISO();

  const resultsMap = new Map<string, z.infer<typeof JudgeResultSchema>>();
  if (success) {
    for (const r of parsedResults) {
      resultsMap.set(r.id, r);
    }
  }

  const candidateJudgements: JudgedItem[] = [];

  for (const item of shortlist) {
    const judgement = resultsMap.get(item.contentHash);

    if (judgement) {
      const judgedItem: JudgedItem = {
        ...item,
        decision: judgement.decision as DecisionLabel,
        relevanceReason: judgement.relevanceReason,
        workflowConnection: judgement.workflowConnection,
        skepticalNotes: judgement.skepticalNotes,
        suggestedAction: judgement.suggestedAction,
        llmScore: judgement.llmScore,
        judgedAt,
      };

      const isSelectLabel = ["ADOPT_NOW", "SPIKE", "WATCH"].includes(judgement.decision);
      const isGoodScore = judgement.llmScore >= minLLMScore;

      if (isSelectLabel && isGoodScore) {
        candidateJudgements.push(judgedItem);
      } else {
        let reason: DiscardReason = "llm_ignore";
        if (judgement.decision === "BLOCKED_BY_RISK") {
          reason = "llm_risk";
        }
        ignored.push({ item, reason });
      }
    } else {
      const fallbackItem: JudgedItem = {
        ...item,
        decision: "UNKNOWN",
        relevanceReason: "Không thể phân tích kết quả từ LLM.",
        workflowConnection: "Chưa xác định",
        skepticalNotes: "LLM response parse failure",
        suggestedAction: "",
        llmScore: 0,
        judgedAt,
      };
      ignored.push({ item, reason: "llm_unknown" });
    }
  }

  candidateJudgements.sort((a, b) => b.llmScore - a.llmScore);

  const selectedList = candidateJudgements.slice(0, maxSelectedPerDay);
  const capExceeded = candidateJudgements.slice(maxSelectedPerDay);

  for (const item of capExceeded) {
    ignored.push({ item, reason: "cap_exceeded" });
  }

  selected.push(...selectedList);

  return { selected, ignored };
}

export async function generateDailySummary(
  provider: LLMProvider,
  selectedItems: JudgedItem[],
  date: string,
  promptTemplate: string
): Promise<string> {
  const itemsJson = JSON.stringify(
    selectedItems.map((item) => ({
      title: item.title,
      decision: item.decision,
      summary: item.summary,
      relevanceReason: item.relevanceReason,
    })),
    null,
    2
  );

  const prompt = promptTemplate
    .replace("{{DATE}}", date)
    .replace("{{ITEMS_JSON}}", itemsJson);

  try {
    const summary = await provider.generateText(prompt);
    return summary.trim();
  } catch (e: any) {
    console.error(`[ERROR] Failed to generate daily summary: ${e.message}`);
    return "Không có tín hiệu đủ đáng chú ý hôm nay.";
  }
}
