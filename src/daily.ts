import * as path from "path";
import { readFileSync } from "fs";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { initDb } from "./storage/db.js";
import { createProvider } from "./llm/createProvider.js";
import { todayISO, nowISO } from "./utils/date.js";
import { safeWriteFile } from "./utils/file.js";
import { collectAll } from "./pipeline/collect.js";
import { normalizeItems } from "./pipeline/normalize.js";
import { dedupeItems } from "./pipeline/dedupe.js";
import { prefilterItems, TopicsConfig } from "./pipeline/prefilter.js";
import { judgeItems, generateDailySummary } from "./pipeline/judge.js";
import { renderDailyMarkdown } from "./pipeline/renderDaily.js";
import { markSeen } from "./storage/seenStore.js";
import { upsertCandidates, updateCandidateJudgement } from "./storage/candidateStore.js";
import { Source, AppConfig, CandidateItem, JudgedItem, DiscardReason, DailyResult } from "./types.js";
import { generateIndexReadme } from "./pipeline/generateIndex.js";

// Optional import since it is implemented in Step 9
let sendTelegramNotification: any = null;
try {
  const telegramMod = await import("./delivery/telegram.js");
  sendTelegramNotification = telegramMod.sendTelegramNotification;
} catch (e) {
  // Graceful skip if not present yet
}

const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["rss", "github_releases"]),
  url: z.string().optional(),
  repo: z.string().optional(),
  enabled: z.boolean(),
  tags: z.array(z.string()),
  weight: z.number(),
});
const SourcesSchema = z.array(SourceSchema);

const CategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  keywords: z.array(z.string()),
});
const TopicsSchema = z.object({
  categories: z.array(CategorySchema),
  prefilter: z.object({
    minScore: z.number(),
    maxCandidatesForLLM: z.number(),
  }),
  judge: z.object({
    maxSelectedPerDay: z.number(),
    minLLMScore: z.number(),
  }),
});

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    dryRun: false,
    verbose: false,
    date: undefined as string | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--verbose") {
      result.verbose = true;
    } else if (arg === "--date") {
      result.date = args[i + 1];
      i++;
    }
  }

  return result;
}

function validateStartup(config: AppConfig, sources: Source[]): void {
  const enabledSources = sources.filter((s) => s.enabled);
  if (enabledSources.length === 0) {
    throw new Error("No enabled sources found in config/sources.json");
  }
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required. Add it to .env");
  }
  if (!config.githubToken) {
    console.warn("[WARN] GITHUB_TOKEN not set. GitHub API rate limit: 60 req/hr");
  }
}

function loadSources(config: AppConfig): Source[] {
  const filePath = path.join(config.paths.configDir, "sources.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return SourcesSchema.parse(data) as Source[];
}

function loadTopics(config: AppConfig): TopicsConfig {
  const filePath = path.join(config.paths.configDir, "topics.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return TopicsSchema.parse(data) as TopicsConfig;
}

function loadPrompt(config: AppConfig, filename: string): string {
  const filePath = path.join(config.paths.promptsDir, filename);
  return readFileSync(filePath, "utf-8");
}

function persistRejected(
  db: any,
  rejected: Array<{ item: CandidateItem; reason: DiscardReason }>
): void {
  const now = nowISO();
  for (const entry of rejected) {
    markSeen(db, {
      id: entry.item.contentHash,
      sourceId: entry.item.sourceId,
      title: entry.item.title,
      url: entry.item.url,
      status: "ignored",
      reason: entry.reason,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }
}

function persistSelected(db: any, selected: JudgedItem[]): void {
  const now = nowISO();
  for (const item of selected) {
    markSeen(db, {
      id: item.contentHash,
      sourceId: item.sourceId,
      title: item.title,
      url: item.url,
      status: "selected",
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }
}

function persistIgnoredByLLM(
  db: any,
  ignored: Array<{ item: CandidateItem; reason: DiscardReason }>
): void {
  const now = nowISO();
  for (const entry of ignored) {
    markSeen(db, {
      id: entry.item.contentHash,
      sourceId: entry.item.sourceId,
      title: entry.item.title,
      url: entry.item.url,
      status: "ignored",
      reason: entry.reason,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }
}

async function main() {
  const args = parseArgs();
  const config = loadConfig();
  const sources = loadSources(config);
  const topics = loadTopics(config);

  validateStartup(config, sources);

  const db = initDb(config.paths.dbPath);
  const llm = createProvider(config);
  const date = args.date ?? todayISO();

  if (args.verbose) {
    console.log(`[START] Pipeline started for date: ${date}`);
  }

  // 1. COLLECT
  const rawItems = await collectAll(sources, config, args);
  if (args.verbose) {
    console.log(`[COLLECT] Collected ${rawItems.length} raw items total.`);
  }

  if (rawItems.length === 0) {
    console.error("[ERROR] Lỗi thu thập dữ liệu: Không thu thập được item nào từ các nguồn.");
    process.exit(1);
  }

  // 2. NORMALIZE
  const normalized = normalizeItems(rawItems);

  // 3. DEDUPE
  const { newItems, duplicates } = dedupeItems(db, normalized);

  // 4. PREFILTER
  const { shortlist, rejected } = prefilterItems(newItems, topics, args);

  if (!args.dryRun) {
    persistRejected(db, rejected);
  }

  // 5. JUDGE
  let selected: JudgedItem[] = [];
  let ignored: Array<{ item: CandidateItem; reason: DiscardReason }> = [];

  if (shortlist.length > 0) {
    const judgePrompt = loadPrompt(config, "item-judge.md").replace(/\{\{LANGUAGE\}\}/g, config.reportLanguage);
    const judgeResult = await judgeItems(llm, shortlist, judgePrompt, {
      verbose: args.verbose,
      minLLMScore: topics.judge.minLLMScore,
      maxSelectedPerDay: topics.judge.maxSelectedPerDay,
    });
    selected = judgeResult.selected;
    ignored = judgeResult.ignored;
  } else {
    if (args.verbose) {
      console.log("[JUDGE] Shortlist is empty. Skipping LLM judge.");
    }
  }

  if (!args.dryRun) {
    upsertCandidates(db, shortlist);
    for (const item of selected) {
      updateCandidateJudgement(db, item.contentHash, {
        decision: item.decision,
        llmScore: item.llmScore,
        relevanceReason: item.relevanceReason,
        workflowConnection: item.workflowConnection,
        skepticalNotes: item.skepticalNotes,
        suggestedAction: item.suggestedAction,
        judgedAt: item.judgedAt,
      });
    }
    persistSelected(db, selected);
    persistIgnoredByLLM(db, ignored);
  }

  // 6. SUMMARY
  let generalNotes = "";
  if (selected.length > 0) {
    const summaryPrompt = loadPrompt(config, "daily-summary.md").replace(/\{\{LANGUAGE\}\}/g, config.reportLanguage);
    generalNotes = await generateDailySummary(llm, selected, date, summaryPrompt);
  } else {
    generalNotes = "Không có tín hiệu đủ đáng chú ý hôm nay.";
  }

  // 7. RENDER
  const result: DailyResult = {
    date,
    selectedItems: selected,
    totalCollected: rawItems.length,
    totalAfterDedupe: newItems.length,
    totalAfterPrefilter: shortlist.length,
    ignoredCount: rejected.length + ignored.length,
    noItemToday: selected.length === 0,
    generalNotes,
  };

  const markdown = renderDailyMarkdown(result);

  // 8. WRITE & DELIVER
  if (args.dryRun) {
    console.log("\n--- [DRY RUN OUTPUT] ---");
    console.log(markdown);
  } else {
    const filePath = path.join(config.paths.docsDaily, `${date}.md`);
    try {
      const { fileExists } = await import("./utils/file.js");
      const exists = await fileExists(filePath);
      
      let shouldDeliver = true;

      if (exists) {
        if (result.noItemToday) {
          console.log(`[SKIP] Không có tin mới, bỏ qua việc ghi đè file cũ: ${filePath}`);
          shouldDeliver = false; // Đã tồn tại báo cáo cũ rồi và không có tin mới thì không báo nữa
        } else {
          const oldContent = readFileSync(filePath, "utf-8");
          const timeStr = new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
          const appendedContent = `${oldContent}\n\n---\n\n## 🕒 Cập nhật bổ sung lúc ${timeStr}\n\n${markdown}`;
          await safeWriteFile(filePath, appendedContent);
          console.log(`✓ Daily radar appended: ${filePath}`);
        }
      } else {
        await safeWriteFile(filePath, markdown);
        console.log(`✓ Daily radar saved: ${filePath}`);
      }

      // 9. DELIVER
      if (shouldDeliver && config.telegram && sendTelegramNotification) {
        await sendTelegramNotification(config.telegram, result, config.publicPageUrl).catch((e: any) => {
          console.warn(`[WARN] Telegram delivery failed: ${e.message}`);
        });
      }

    } catch (e: any) {
      console.error(`[ERROR] Ghi file markdown thất bại: ${e.message}`);
      console.log("\n--- [FALLBACK OUTPUT TO CONSOLE] ---");
      console.log(markdown);
      process.exit(1);
    }

    // 10. GENERATE INDEX FOR GITHUB PAGES (always runs, even if no new items)
    await generateIndexReadme(config);
  }
}

main().catch((e) => {
  console.error(`[CRITICAL ERROR] ${e.message}`);
  process.exit(1);
});
