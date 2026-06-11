import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

function generateMarkdownList(title, dirPath, linkPrefix) {
  if (!fs.existsSync(dirPath)) return '';
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .reverse(); // Newest first

  if (files.length === 0) return '_Chưa có dữ liệu_\n';

  let md = `## ${title}\n\n`;
  for (const file of files) {
    const name = file.replace('.md', '');
    md += `- [${name}](${linkPrefix}${name})\n`;
  }
  return md + '\n';
}

function main() {
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const dailyDir = path.join(docsDir, 'daily');
  const reportsDir = path.join(docsDir, 'reports');

  // Generate Home Index
  const homeContent = `
---
layout: home

hero:
  name: "ObioRadar"
  text: "Personal AI Technology Radar"
  tagline: "Biến tín hiệu công nghệ thành kiến thức hàng ngày."
  actions:
    - theme: brand
      text: Đọc báo cáo mới nhất
      link: /daily/
    - theme: alt
      text: Deep Dives
      link: /reports/
---

## 📅 Bản tin mới nhất
Hãy truy cập menu **Daily Digest** hoặc **Deep Dives** để đọc các báo cáo công nghệ được AI tổng hợp tự động mỗi ngày.
`;
  fs.writeFileSync(path.join(docsDir, 'index.md'), homeContent.trim());

  // Generate Daily Index
  const dailyIndex = `# Báo Cáo Hàng Ngày (Daily Digest)\n\n` + generateMarkdownList('Danh sách các bản tin', dailyDir, '/daily/');
  if (!fs.existsSync(dailyDir)) fs.mkdirSync(dailyDir, { recursive: true });
  fs.writeFileSync(path.join(dailyDir, 'index.md'), dailyIndex);

  // Generate Reports Index
  const reportsIndex = `# Báo Cáo Chuyên Sâu (Deep Dives)\n\n` + generateMarkdownList('Danh sách các bài viết phân tích', reportsDir, '/reports/');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'index.md'), reportsIndex);

  console.log('✅ Generated index files successfully.');
}

main();
