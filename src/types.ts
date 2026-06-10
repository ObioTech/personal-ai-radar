export type DecisionLabel = "ADOPT_NOW" | "SPIKE" | "WATCH" | "IGNORE" | "BLOCKED_BY_RISK" | "UNKNOWN";

export type DiscardReason =
  | "duplicate"
  | "keyword_miss"
  | "cap_exceeded"
  | "llm_ignore"
  | "llm_risk"
  | "llm_unknown";

export type SeenStatus = "selected" | "ignored" | "reported";

export interface Source {
  id: string;
  name: string;
  type: "rss" | "github_releases";
  url?: string;
  repo?: string;
  enabled: boolean;
  tags: string[];
  weight: number;
}

export interface RawItem {
  sourceId: string;
  sourceName: string;
  sourceWeight: number;
  title: string;
  url: string;
  publishedAt: string; // ISO 8601
  summary: string;     // truncated <= 500 chars, could be empty
  contentHash: string; // SHA256(url)
}

export interface CandidateItem extends RawItem {
  slug: string;
  normalizedAt: string;
  matchedKeywords: string[];
  matchedCategories: string[];
  prefilterScore: number; // 0-1
  rankScore: number;      // prefilterScore * sourceWeight
}

export interface JudgedItem extends CandidateItem {
  decision: DecisionLabel;
  relevanceReason: string;
  workflowConnection: string;
  skepticalNotes: string;
  suggestedAction: string;
  llmScore: number; // 0-10
  judgedAt: string;
}

export interface DailyResult {
  date: string; // YYYY-MM-DD
  selectedItems: JudgedItem[];
  totalCollected: number;
  totalAfterDedupe: number;
  totalAfterPrefilter: number;
  ignoredCount: number;
  noItemToday: boolean;
  generalNotes: string;
}

export interface ReportInput {
  mode: "search" | "url";
  query?: string;
  url?: string;
  force: boolean;
  verbose: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface AppConfig {
  llmProvider: string;
  geminiApiKey: string;
  geminiModel: string;
  githubToken?: string;
  telegram?: TelegramConfig;
  paths: {
    docsDaily: string;
    docsReports: string;
    dataDir: string;
    dbPath: string;
    configDir: string;
    promptsDir: string;
  };
}
