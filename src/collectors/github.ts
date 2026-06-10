import { Source, RawItem } from "../types.js";
import { sha256 } from "../utils/hash.js";

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/#+\s+/g, "") // Headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
    .replace(/\*([^*]+)\*/g, "$1") // Italic
    .replace(/`([^`]+)`/g, "$1") // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/-\s+/g, "") // Bullet points
    .replace(/\r?\n/g, " ") // Newlines
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export async function fetchGithubReleases(
  source: Source,
  githubToken?: string,
  options?: { verbose?: boolean }
): Promise<RawItem[]> {
  if (!source.repo) {
    throw new Error(`Missing repository path for GitHub source: ${source.id}`);
  }

  const url = `https://api.github.com/repos/${source.repo}/releases?per_page=5`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "obio-radar/0.1.0",
  };

  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (options?.verbose) {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    console.log(`[GITHUB] Rate limit remaining for ${source.repo}: ${remaining}`);
  }

  if (response.status === 401) {
    throw new Error("GitHubAuthError: Missing or invalid GITHUB_TOKEN");
  }
  if (response.status === 403) {
    throw new Error("GitHubRateLimitError: Rate limit exceeded. Remaining: 0");
  }
  if (response.status === 404) {
    throw new Error(`GitHubNotFoundError: Repo ${source.repo} not found`);
  }
  if (!response.ok) {
    throw new Error(
      `GitHubError: Failed to fetch releases for ${source.repo} (HTTP ${response.status})`
    );
  }

  const releases = (await response.json()) as any[];
  const rawItems: RawItem[] = [];

  for (const release of releases) {
    if (release.draft || release.prerelease) {
      continue;
    }

    const title = release.name || release.tag_name || "Untitled Release";
    const bodyStr = stripMarkdown(release.body || "");
    const summary = bodyStr.substring(0, 500);
    const publishedAt = release.published_at;

    rawItems.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceWeight: source.weight,
      title,
      url: release.html_url,
      publishedAt,
      summary,
      contentHash: sha256(release.html_url),
    });
  }

  return rawItems;
}
