# Obio Radar 📡

A personal AI-driven technology radar that collects, pre-filters, and judges technology signals to generate daily markdown newsletters and deep-dive technical reports in Vietnamese.

---

## Architecture Overview

```
[RSS / GitHub Sources] 
         │
         ▼ (Fetch daily)
[Raw Items] ──► [Normalization & HTML Strip]
         │
         ▼
[Deduplication (SQLite seen_items)] 
         │
         ▼ (New Items)
[Keyword Prefilter (topics.json)] ──► Discards saved to seen_items
         │
         ▼ (Shortlist max 15)
[LLM Judge (Gemini API)] ──► Discards saved to seen_items
         │
         ▼ (Selected Items max 5)
[LLM Daily Summary]
         │
         ├──────────────────────────┐
         ▼                          ▼
[Daily Markdown Digest]    [Telegram Notification]
(docs/daily/YYYY-MM-DD.md)
```

---

## Quick Start

1. **Prerequisites**: Node.js >= 18.
2. **Install**:
   ```bash
   npm install
   ```
3. **Configure env**: Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
4. **Run dry-run (Dev)**:
   ```bash
   npm run dev
   ```
5. **Run daily job**:
   ```bash
   npm run daily
   ```

---

## Usage

### 1. Run Daily Pipeline
Crawls sources, scores items, judges using LLM, saves state to `data/obio-radar.sqlite`, renders markdown, and sends Telegram alert.
```bash
npm run daily
```
**Flags:**
- `--verbose`: Prints debug logs.
- `--date YYYY-MM-DD`: Simulates/backfills execution for a specific date.

### 2. Dev / Dry Run
Runs the entire pipeline without writing database states, saving markdown files, or sending Telegram alerts. Prints markdown directly to stdout.
```bash
npm run dev
```

### 3. Generate Deep-Dive Technical Report
Flashes an in-depth reading note for any candidate stored in your database, or directly fetches any URL and writes a 10-section structured markdown analysis inside `docs/reports/`.
```bash
# Generate from database query matches
npm run report -- "playwright"

# Generate directly from a web URL
npm run report -- --url "https://simonwillison.net/2026/Jun/10/mcp/"
```
**Flags:**
- `--force`: Overwrites report if the output file already exists.
- `--verbose`: Log detailed info.

---

## Setup & Configuration

### Environment Variables (`.env`)

- `LLM_PROVIDER`: LLM backend, defaults to `gemini`.
- `GEMINI_API_KEY`: Google Gemini API key (Required).
- `GEMINI_MODEL`: Model name, defaults to `gemini-2.5-flash`.
- `GITHUB_TOKEN`: GitHub Personal Access Token (Optional but recommended to avoid rate limits).
- `TELEGRAM_BOT_TOKEN`: Bot API Token (Optional).
- `TELEGRAM_CHAT_ID`: Recipient chat/channel ID (Optional).

### Sources Configuration (`config/sources.json`)

The `config/sources.json` file is used to configure the technology signal sources that the system collects daily.

#### How to Add New Sources

To add a new signal source, open `config/sources.json` and add a JSON object to the array.

##### RSS Source Structure:
```json
{
  "id": "project-identifier",
  "name": "Display Source Name",
  "type": "rss",
  "url": "https://domain.com/feed-path/atom.xml",
  "enabled": true,
  "tags": ["topic-1", "topic-2"],
  "weight": 1.2
}
```

##### GitHub Releases Source Structure:
```json
{
  "id": "project-identifier",
  "name": "Display Source Name",
  "type": "github_releases",
  "repo": "owner/repo-name",
  "enabled": true,
  "tags": ["topic-1", "topic-2"],
  "weight": 1.2
}
```

##### Detail Fields:
- `id` *(string, required)*: Unique identifier, lowercase, no spaces, used for deduplication in the DB.
- `name` *(string, required)*: Friendly display name of the source.
- `type` *(string, required)*: Must be either `"rss"` or `"github_releases"`.
- `url` *(string)*: Required if type is `"rss"`. The URL of the XML/RSS feed.
- `repo` *(string)*: Required if type is `"github_releases"`. Format: `owner/repo` (e.g. `facebook/react`).
- `enabled` *(boolean, required)*: `true` to enable collection, `false` to temporarily disable.
- `tags` *(array of strings, required)*: List of categorization tags (e.g. `["mcp-server", "ai-coding-agents"]`).
- `weight` *(number, required)*: Multiplier weight for the source (from `0.5` to `2.0`). Higher quality sources should have a larger weight.

### Topics Configuration (`config/topics.json`)

Define interests, prefilter parameters, and judge logic. Keep keyword list compact (e.g. 3 keywords per category) so matches pass the prefilter score threshold easily.
```json
{
  "categories": [
    {
      "id": "mcp-server",
      "label": "Model Context Protocol",
      "keywords": ["mcp", "model context protocol", "modelcontextprotocol"]
    }
  ],
  "prefilter": {
    "minScore": 0.3,
    "maxCandidatesForLLM": 15
  },
  "judge": {
    "maxSelectedPerDay": 5,
    "minLLMScore": 5
  }
}
```

---

## Decision Labels

- `ADOPT_NOW`: ÁP DỤNG NGAY — Ready, stable, directly applies to active workflows.
- `SPIKE`: SPIKE — Worth prototyping / experimenting (takes <1 day).
- `WATCH`: WATCH — Revisit and track later.
- `IGNORE`: Lọc bỏ — Not relevant.
- `BLOCKED_BY_RISK`: BLOCKED — System access tools requiring security review first.

---

## Cron Schedule (macOS / crontab)

Run the tool every morning at 8:00 AM automatically using the helper runner script:
```bash
0 8 * * * /Users/apple/Documents/00.PERSONAL/ObioRadar/run-daily.sh
```

---

## Troubleshooting

- **Rate Limits**: If you run into GitHub API limits, verify `GITHUB_TOKEN` is loaded in `.env`.
- **Missing API Key**: Ensure `GEMINI_API_KEY` is present in `.env` and loaded.
- **SQLite locks**: Delete WAL/SHM temp files in `data/` if database locks up under unexpected crashes.

---

## Out of Scope

- Crawling full contents of pages (only RSS/Releases summaries are fetched).
- Web Dashboard (Markdown is the primary UI).
- Real-time stream alerts (Obio is designed for once-a-day CLI runs).

---

## Currently Tracked Sources (Active Sources)

The system is currently tracking the following sources:

*   **RSS Feeds**:
    *   **Simon Willison's Blog** (`simonw-blog`): Quality blog focusing on AI, LLMs, and MCP. (Weight: 1.5)
    *   **The Pragmatic Engineer** (`the-pragmatic-engineer`): In-depth newsletter on software engineering and management. (Weight: 1.3)
    *   **Cursor Changelog** (`cursor-changelog`): Latest updates and changelogs from Cursor Editor. (Weight: 1.4)
*   **GitHub Releases**:
    *   **MCP Spec** (`modelcontextprotocol/modelcontextprotocol`): Specification updates for the Model Context Protocol. (Weight: 1.5)
    *   **MCP TS SDK** (`modelcontextprotocol/typescript-sdk`): Official TypeScript SDK for MCP. (Weight: 1.5)
    *   **Anthropic Python SDK** (`anthropics/anthropic-sdk-python`) & **Google GenAI Python SDK** (`google-gemini/generative-ai-python`): Official Python SDKs for agent/LLM integrations. (Weight: 1.2)
    *   **Playwright** (`microsoft/playwright`): E2E testing framework. (Weight: 1.2)
    *   **Mobile Testing & Automation**: **Maestro** (`mobile-dev-inc/maestro`, Weight: 1.3) & **Detox** (`wix/Detox`, Weight: 1.1)
    *   **Agent Orchestration / LLM RAG**: **LangChain JS** (`langchain-ai/langchainjs`, Weight: 1.0) & **LlamaIndex TS** (`run-llama/LlamaIndexTS`, Weight: 1.0)
    *   **Mobile Frameworks**: **Expo** (`expo/expo`, Weight: 1.1) & **React Native** (`facebook/react-native`, Weight: 1.2)
    *   **Security & Linting Tools**: **Semgrep** (`returntocorp/semgrep`, Weight: 1.1)

---

## License

MIT
