import { readdirSync, existsSync, readFileSync } from "fs";
import * as path from "path";
import { AppConfig } from "../types.js";
import { safeWriteFile } from "../utils/file.js";

function extractTitle(filePath: string, defaultTitle: string): string {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Match YAML frontmatter title: title: "..." or title: '...' or title: ...
    const frontmatterTitleMatch = content.match(/^---\r?\n[\s\S]*?^title:\s*(?:"([^"]+)"|'([^']+)'|([^\r\n]+))/m);
    if (frontmatterTitleMatch) {
      const title = frontmatterTitleMatch[1] || frontmatterTitleMatch[2] || frontmatterTitleMatch[3];
      if (title) return title.trim();
    }
    // Match first # Title
    const h1Match = content.match(/^#\s+([^\r\n]+)/m);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }
  } catch (error) {
    // Ignore and fallback
  }
  return defaultTitle;
}

export async function generateIndexReadme(config: AppConfig) {
  const dailyDir = config.paths.docsDaily;
  const reportsDir = config.paths.docsReports;
  const notesDir = path.join(path.dirname(config.paths.docsDaily), "notes");
  const rootReadmePath = path.join(config.paths.dataDir, "PAGES_README.md");

  let indexContent = `# 📡 ObioRadar - Personal AI Tech Radar\n\n`;
  indexContent += `Chào mừng đến với **ObioRadar**, hệ thống AI tự động thu thập, phân tích và tổng hợp thông tin công nghệ hàng ngày.\n\n`;
  indexContent += `---\n\n`;

  // 1. Daily digests
  indexContent += `## 📅 Bản tin Hàng ngày\n\n`;
  try {
    if (existsSync(dailyDir)) {
      const files = readdirSync(dailyDir)
        .filter((file) => file.endsWith(".md"))
        .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

      if (files.length === 0) {
        indexContent += `*Chưa có bản tin nào.*\n\n`;
      } else {
        indexContent += `| Ngày | Bản tin |\n`;
        indexContent += `| :--- | :--- |\n`;
        for (const file of files) {
          const dateStr = file.replace(".md", "");
          indexContent += `| **${dateStr}** | [Đọc bản tin ngày ${dateStr}](./docs/daily/${file}) |\n`;
        }
        indexContent += `\n`;
      }
    } else {
      indexContent += `*Thư mục bản tin hàng ngày không tồn tại.*\n\n`;
    }
  } catch (error: any) {
    console.error(`[ERROR] Lỗi khi quét thư mục bản tin daily: ${error.message}`);
  }

  // 2. Deep-dive reports
  try {
    if (existsSync(reportsDir)) {
      const files = readdirSync(reportsDir)
        .filter((file) => file.endsWith(".md") && file !== ".gitkeep")
        .sort((a, b) => a.localeCompare(b));

      if (files.length > 0) {
        indexContent += `## 🔍 Báo cáo Chuyên sâu (Deep-dive Reports)\n\n`;
        indexContent += `| Báo cáo | Chi tiết |\n`;
        indexContent += `| :--- | :--- |\n`;
        for (const file of files) {
          const filePath = path.join(reportsDir, file);
          const defaultTitle = file.replace(".md", "");
          const title = extractTitle(filePath, defaultTitle);
          indexContent += `| **${title}** | [Xem báo cáo](./docs/reports/${file}) |\n`;
        }
        indexContent += `\n`;
      }
    }
  } catch (error: any) {
    console.error(`[ERROR] Lỗi khi quét thư mục báo cáo reports: ${error.message}`);
  }

  // 3. Manual technical notes
  try {
    if (existsSync(notesDir)) {
      const files = readdirSync(notesDir)
        .filter((file) => file.endsWith(".md") && file !== ".gitkeep")
        .sort((a, b) => a.localeCompare(b));

      if (files.length > 0) {
        indexContent += `## 📝 Ghi chú Kỹ thuật (Technical Notes)\n\n`;
        indexContent += `| Ghi chú | Chi tiết |\n`;
        indexContent += `| :--- | :--- |\n`;
        for (const file of files) {
          const filePath = path.join(notesDir, file);
          const defaultTitle = file.replace(".md", "");
          const title = extractTitle(filePath, defaultTitle);
          indexContent += `| **${title}** | [Đọc ghi chú](./docs/notes/${file}) |\n`;
        }
        indexContent += `\n`;
      }
    }
  } catch (error: any) {
    console.error(`[ERROR] Lỗi khi quét thư mục ghi chú notes: ${error.message}`);
  }

  indexContent += `---\n*Được tạo tự động bởi ObioRadar GitHub Actions.*\n`;

  try {
    await safeWriteFile(rootReadmePath, indexContent);
    console.log(`[INDEX] Đã tạo thành công README.md trang chủ tại ${rootReadmePath}`);
  } catch (error: any) {
    console.error(`[ERROR] Không thể tạo file index README: ${error.message}`);
  }
}

