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

## Setup & Configuration

### Environment Variables (`.env`)

- `LLM_PROVIDER`: LLM backend, defaults to `gemini`.
- `GEMINI_API_KEY`: Google Gemini API key (Required).
- `GEMINI_MODEL`: Model name, defaults to `gemini-2.5-flash`.
- `GITHUB_TOKEN`: GitHub Personal Access Token (Optional but recommended to avoid rate limits).
- `TELEGRAM_BOT_TOKEN`: Bot API Token (Optional).
- `TELEGRAM_CHAT_ID`: Recipient chat/channel ID (Optional).

### Sources Configuration (`config/sources.json`)

Configure news RSS feeds or GitHub repositories to track. Example:
```json
[
  {
    "id": "playwright-releases",
    "name": "Playwright Releases",
    "type": "github_releases",
    "repo": "microsoft/playwright",
    "enabled": true,
    "tags": ["e2e-testing"],
    "weight": 1.2
  }
]
```

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

## Decision Labels

- `ADOPT_NOW`: ÁP DỤNG NGAY — Ready, stable, directly applies to active workflows.
- `SPIKE`: SPIKE — Worth prototyping / experimenting (takes <1 day).
- `WATCH`: WATCH — Revisit and track later.
- `IGNORE`: Lọc bỏ — Not relevant.
- `BLOCKED_BY_RISK`: BLOCKED — System access tools requiring security review first.

---

## Cron Schedule (macOS / crontab)

Run the tool every morning at 8:00 AM automatically:
```bash
0 8 * * * cd /Users/apple/Documents/00.PERSONAL/ObioRadar && npm run daily >> logs/daily.log 2>&1
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

## License

MIT
