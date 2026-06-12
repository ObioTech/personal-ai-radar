# Vision & Core Principles

## Vision

Obio Radar exists to help a technical professional or AI-assisted engineer avoid missing important technology signals by transforming a large stream of information into a small set of high-value, actionable, and critically evaluated reading recommendations.

The primary output is human-readable knowledge, not notifications.

---

## Core Principles

### 1. Signal Over Volume

The system is optimized for finding a few valuable signals rather than collecting as much information as possible.

Prefer:
* 3 highly relevant items
* over 30 average items
* over 300 noisy items

Success is measured by relevance, not quantity.

### 2. Human Reading First

The primary artifact is markdown.

The system should optimize for:
* Daily reading notes
* Technical reading reports
* Long-term knowledge archive

Dashboards, notifications, and integrations are secondary.

### 3. Skepticism by Default

The system must not assume:
* New tools are automatically useful
* New MCP servers should be adopted
* New agent frameworks are production-ready

Each recommendation should actively consider:
* Missing evidence
* Risks
* Security concerns
* Hype versus practical value

### 4. Human Owns Adoption

The system may recommend:
* WATCH
* SPIKE
* ADOPT_NOW

The system must not automatically:
* Create backlog items
* Create GitHub issues
* Install tools
* Modify workflows
* Trigger adoption actions

Final adoption decisions belong to a human.

### 5. AI Is a Judge, Not a Source

AI is responsible for:
* Filtering
* Ranking
* Summarizing
* Critiquing

AI is not the source of truth.

Primary sources remain:
* RSS feeds
* GitHub repositories
* Changelogs
* Official documentation

### 6. Markdown-First Knowledge

Important outputs should exist as markdown files.

Examples:
* Daily Radar reports
* Deep-dive reports

The system should avoid locking important knowledge inside proprietary storage or UI-only experiences.

### 7. Local-First by Default

The system should run locally without requiring cloud infrastructure.

Telegram, remote delivery, or future hosted deployment should remain optional layers.

---

## Future Architectural Principle

*Note: This principle does NOT affect MVP implementation. It exists to guide future integrations.*

### Radar Owns Signal Discovery

Obio Radar is responsible for:
* Collection
* Normalization
* Filtering
* Judging
* Archiving

### AI Agent Owns Actions

AI Agents are responsible for:
* Reading reports
* Discussing implications
* Planning experiments
* Executing spikes
* Producing recommendations

Obio Radar should not become a general-purpose autonomous agent.
AI Agents should not become RSS readers.
