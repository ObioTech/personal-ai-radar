import { readdirSync } from "fs";
import * as path from "path";
import { AppConfig } from "../types.js";
import { safeWriteFile } from "../utils/file.js";

export async function generateIndexReadme(config: AppConfig) {
  const dailyDir = config.paths.docsDaily;
  const rootReadmePath = path.join(config.paths.dataDir, "PAGES_README.md");

  let indexContent = `# ObioRadar - Personal AI Tech Radar\n\n`;
  indexContent += `Chào mừng đến với ObioRadar. Dưới đây là các bản tin công nghệ AI được tổng hợp tự động hàng ngày.\n\n`;
  indexContent += `## 📅 Bản tin Hàng ngày\n\n`;

  try {
    const files = readdirSync(dailyDir)
      .filter((file) => file.endsWith(".md"))
      .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    if (files.length === 0) {
      indexContent += `*Chưa có bản tin nào.*\n`;
    } else {
      indexContent += `| Ngày | Bản tin |\n`;
      indexContent += `| :--- | :--- |\n`;
      for (const file of files) {
        const dateStr = file.replace(".md", "");
        indexContent += `| **${dateStr}** | [Đọc bản tin ngày ${dateStr}](./docs/daily/${file}) |\n`;
      }
    }

    indexContent += `\n---\n*Được tạo tự động bởi ObioRadar GitHub Actions.*\n`;

    await safeWriteFile(rootReadmePath, indexContent);
    console.log(`[INDEX] Đã tạo thành công README.md trang chủ.`);
  } catch (error: any) {
    console.error(`[ERROR] Không thể tạo file index README: ${error.message}`);
  }
}
