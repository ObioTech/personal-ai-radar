export function todayISO(): string {
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function parseDate(input: string): string {
  if (!input) return nowISO();
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    const date = new Date(num < 10000000000 ? num * 1000 : num);
    return isNaN(date.getTime()) ? nowISO() : date.toISOString();
  }
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? nowISO() : date.toISOString();
}

export function formatDisplayDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return isoDate;
    }
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  } catch (e) {
    return isoDate;
  }
}
