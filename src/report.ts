import * as path from "path";
import { readFileSync } from "fs";
import { loadConfig } from "./config.js";
import { initDb } from "./storage/db.js";
import { createProvider } from "./llm/createProvider.js";
import { nowISO } from "./utils/date.js";
import { fileExists, safeWriteFile } from "./utils/file.js";
import { sha256 } from "./utils/hash.js";
import { slugifyUrl } from "./utils/slug.js";
import { findCandidatesByQuery } from "./storage/candidateStore.js";
import { updateSeenStatus } from "./storage/seenStore.js";
import { renderReportMarkdown } from "./pipeline/renderReport.js";
import { CandidateItem, ReportInput } from "./types.js";
import { LLMProvider } from "./llm/types.js";
import { generateIndexReadme } from "./pipeline/generateIndex.js";

function parseReportArgs(): ReportInput {
  const args = process.argv.slice(2);
  const result: ReportInput = {
    mode: "search",
    force: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (arg === "--force") {
      result.force = true;
    } else if (arg === "--verbose") {
      result.verbose = true;
    } else if (arg === "--url") {
      result.mode = "url";
      result.url = args[i + 1];
      i++;
    } else if (!arg.startsWith("-")) {
      result.query = arg;
    }
  }

  return result;
}

async function fetchMinimalItemFromUrl(url: string): Promise<CandidateItem> {
  const cleanUrlStr = url.trim();
  let title = "";
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(cleanUrlStr, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<title>([^<]+)<\/title>/i);
      if (match && match[1]) {
        title = match[1].trim();
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  if (!title) {
    try {
      title = new URL(cleanUrlStr).hostname;
    } catch {
      title = "Direct URL Source";
    }
  }

  const hash = sha256(cleanUrlStr);
  const slug = slugifyUrl(cleanUrlStr);

  return {
    contentHash: hash,
    sourceId: "direct-url",
    sourceName: "Direct URL",
    sourceWeight: 1.0,
    title,
    url: cleanUrlStr,
    publishedAt: nowISO(),
    summary: "",
    slug,
    normalizedAt: nowISO(),
    matchedKeywords: [],
    matchedCategories: [],
    prefilterScore: 1.0,
    rankScore: 1.0,
  };
}

async function generateDeepDiveReport(
  provider: LLMProvider,
  item: CandidateItem & { decision?: string | null },
  promptTemplate: string
): Promise<string> {
  const prompt = promptTemplate
    .replace("{{TITLE}}", item.title)
    .replace("{{URL}}", item.url)
    .replace("{{SUMMARY}}", item.summary || "(Không có tóm tắt)")
    .replace("{{CATEGORIES}}", item.matchedCategories.join(", ") || "Chưa phân loại")
    .replace("{{DECISION}}", item.decision ?? "UNKNOWN");

  return await provider.generateText(prompt);
}

function loadPrompt(config: any, filename: string): string {
  const filePath = path.join(config.paths.promptsDir, filename);
  return readFileSync(filePath, "utf-8");
}

async function main() {
  const args = parseReportArgs();
  const config = loadConfig();
  const db = initDb(config.paths.dbPath);
  const llm = createProvider(config);

  let reportItem: (CandidateItem & { decision?: string | null }) | null = null;

  if (args.mode === "search") {
    if (!args.query) {
      console.error("[ERROR] Cần cung cấp từ khóa tìm kiếm hoặc slug.");
      console.error("Cách dùng: npm run report -- <query> hoặc npm run report -- --url <url>");
      process.exit(1);
    }
    const results = findCandidatesByQuery(db, args.query);
    if (results.length === 0) {
      console.error(`Không tìm thấy item nào với query: "${args.query}"`);
      console.error(`Gợi ý: dùng --url nếu muốn generate report từ URL trực tiếp`);
      process.exit(1);
    }
    if (results.length > 1) {
      console.log(`Tìm thấy ${results.length} kết quả:`);
      results.forEach((r, i) => console.log(`  ${i + 1}. ${r.title} (${r.slug})`));
      console.log(`Đang dùng kết quả đầu tiên. Dùng slug cụ thể hơn nếu muốn chọn khác.`);
    }
    reportItem = results[0]!;
  } else {
    if (!args.url) {
      console.error("[ERROR] Cần cung cấp URL sau flag --url.");
      process.exit(1);
    }
    reportItem = await fetchMinimalItemFromUrl(args.url);
  }

  const slug = reportItem.slug || slugifyUrl(reportItem.url);
  const outputPath = path.join(config.paths.docsReports, `${slug}.md`);

  if ((await fileExists(outputPath)) && !args.force) {
    console.error(`Report đã tồn tại: ${outputPath}`);
    console.error(`Dùng --force để ghi đè.`);
    process.exit(1);
  }

  console.log(`[REPORT] Đang tạo deep-dive report cho: ${reportItem.title}...`);

  const prompt = loadPrompt(config, "deep-dive-report.md").replace(/\{\{LANGUAGE\}\}/g, config.reportLanguage);
  const reportContent = await generateDeepDiveReport(llm, reportItem, prompt);
  const markdown = renderReportMarkdown(reportItem, reportContent, slug);

  await safeWriteFile(outputPath, markdown);

  // Patch daily markdown files to replace the placeholder with an actual link
  try {
    const { readdirSync, readFileSync, writeFileSync } = await import("fs");
    const dailyFiles = readdirSync(config.paths.docsDaily).filter(f => f.endsWith(".md"));
    for (const file of dailyFiles) {
      const dailyPath = path.join(config.paths.docsDaily, file);
      let content = readFileSync(dailyPath, "utf-8");
      const targetStr = `<!-- REPORT_LINK:${slug} -->`;
      if (content.includes(targetStr)) {
        content = content.replace(
          targetStr,
          `[📖 Đã có Báo cáo chuyên sâu -> Bấm để đọc](/reports/${slug})`
        );
        writeFileSync(dailyPath, content, "utf-8");
        console.log(`✓ Patched link in daily digest: ${file}`);
      }
    }
  } catch (e: any) {
    console.warn(`[WARN] Failed to patch daily markdown files: ${e.message}`);
  }

  // Update DB seen_items status to reported
  updateSeenStatus(db, reportItem.contentHash, {
    status: "reported",
    reportSlug: slug,
    reportedAt: nowISO(),
  });

  await generateIndexReadme(config);

  console.log(`✓ Report saved: ${outputPath}`);
}

main().catch((e) => {
  console.error(`[CRITICAL ERROR] ${e.message}`);
  process.exit(1);
});
