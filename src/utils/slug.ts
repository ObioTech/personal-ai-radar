export function slugify(input: string): string {
  if (!input) return `item-${Date.now()}`;

  let str = input
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove accents

  // Replace special characters and whitespace with hyphens
  str = str.replace(/[^a-z0-9]+/g, "-");

  // Max length 80 characters (truncate before final trim)
  if (str.length > 80) {
    str = str.substring(0, 80);
  }

  // Trim leading/trailing hyphens
  str = str.replace(/^-+|-+$/g, "");

  if (!str) {
    return `item-${Date.now()}`;
  }

  return str;
}

export function slugifyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;
    if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const extIndex = lastPart.lastIndexOf(".");
      const name = extIndex !== -1 ? lastPart.substring(0, extIndex) : lastPart;
      const slug = slugify(name);
      if (slug && !slug.startsWith("item-")) {
        return slug;
      }
    }
  } catch (e) {
    // Ignore and fallback to slugify the whole URL
  }
  return slugify(url);
}
