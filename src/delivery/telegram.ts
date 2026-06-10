import { TelegramConfig, DailyResult, DecisionLabel } from "../types.js";

function decisionLabelShort(decision: DecisionLabel): string {
  switch (decision) {
    case "ADOPT_NOW":
      return "ÁP DỤNG NGAY ⚡";
    case "SPIKE":
      return "SPIKE 🔬";
    case "WATCH":
      return "WATCH 👀";
    case "BLOCKED_BY_RISK":
      return "BLOCKED ⚠️";
    default:
      return "UNKNOWN ❓";
  }
}

export function formatTelegramMessage(result: DailyResult): string {
  const header = `Obio Radar — ${result.date}`;

  if (result.noItemToday || result.selectedItems.length === 0) {
    return `${header}\n\nKhông có tín hiệu đáng chú ý hôm nay.`;
  }

  const itemsList = result.selectedItems
    .map((item, i) => `${i + 1}. ${item.title} — ${decisionLabelShort(item.decision)}`)
    .join("\n");

  return `${header}

Hôm nay có ${result.selectedItems.length} item đáng đọc:

${itemsList}

Full report:
docs/daily/${result.date}.md`;
}

export async function sendTelegramNotification(
  config: TelegramConfig,
  result: DailyResult
): Promise<void> {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const text = formatTelegramMessage(result);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "Markdown",
    }),
    signal: controller.signal,
  });

  clearTimeout(id);

  if (!response.ok) {
    throw new Error(`Telegram API returned HTTP ${response.status}: ${response.statusText}`);
  }
}
