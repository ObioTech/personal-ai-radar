import { CandidateItem } from "../types.js";
import { todayISO } from "../utils/date.js";

export function renderReportMarkdown(
  item: CandidateItem & { decision?: string | null },
  reportContent: string,
  slug: string
): string {
  const today = todayISO();
  const categoryYaml =
    item.matchedCategories.length > 0
      ? item.matchedCategories.map((c) => `  - ${c}`).join("\n")
      : "  - uncategorized";

  return `---
title: "${item.title.replace(/"/g, '\\"')}"
slug: "${slug}"
category:
${categoryYaml}
decision: ${item.decision ?? "UNKNOWN"}
created_at: ${today}
source_urls:
  - ${item.url}
status: draft
---

# ${item.title} — Ghi Chú Đọc Kỹ Thuật

${reportContent}

---
*Obio Radar | \`npm run report -- ${slug}\` | ${today}*
`;
}
