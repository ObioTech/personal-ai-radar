import { DailyResult, DecisionLabel } from "../types.js";
import { formatDisplayDate, nowISO } from "../utils/date.js";

function decisionLabelVi(decision: DecisionLabel): string {
  switch (decision) {
    case "ADOPT_NOW":
      return "ÁP DỤNG NGAY";
    case "SPIKE":
      return "SPIKE — Thử nhanh";
    case "WATCH":
      return "WATCH — Theo dõi";
    case "IGNORE":
      return "IGNORE";
    case "BLOCKED_BY_RISK":
      return "BLOCKED — Cần đánh giá rủi ro";
    default:
      return "UNKNOWN";
  }
}

export function renderDailyMarkdown(result: DailyResult): string {
  const generatedAt = nowISO();
  const displayDate = formatDisplayDate(result.date);

  let itemsContent = "";
  if (result.noItemToday || result.selectedItems.length === 0) {
    itemsContent = "> Không có tín hiệu đủ đáng chú ý hôm nay.\n";
  } else {
    itemsContent = result.selectedItems
      .map((item, idx) => {
        const index = idx + 1;
        const summaryText = item.summary ? item.summary : "(Không có tóm tắt)";
        const categoriesText = item.matchedCategories.join(" / ") || "Uncategorized";
        const decisionText = decisionLabelVi(item.decision);

        return `### ${index}. [${item.title}](${item.url}) <!-- REPORT_LINK:${item.slug} -->

**Quyết định:** ${decisionText}
**Danh mục:** ${categoriesText}
**Nguồn:** ${item.sourceId}
**Điểm:** ${item.llmScore}/10

**Tóm tắt ngắn:**
${summaryText}

**Vì sao đáng đọc:**
${item.relevanceReason}

**Liên quan tới workflow của tôi:**
${item.workflowConnection}

**Ghi chú nghi ngờ:**
${item.skepticalNotes}

**Đọc sâu hơn:**
*(Tạo báo cáo chi tiết bằng lệnh: \`npm run report -- ${item.slug}\`)*
`;
      })
      .join("\n---\n\n");
  }

  return `---
date: ${result.date}
items_selected: ${result.selectedItems.length}
items_processed: ${result.totalCollected}
generated_at: ${generatedAt}
---

# Obio Radar — ${displayDate}

## Hôm nay đáng đọc gì?

${itemsContent}
---

## Ghi chú chung

${result.generalNotes || "Không có ghi chú chung cho hôm nay."}

---
*Obio Radar | Đã xử lý ${result.totalCollected} item, chọn ${result.selectedItems.length} item | ${result.date}*
`;
}
