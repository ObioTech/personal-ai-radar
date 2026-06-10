import Database from "better-sqlite3";
import * as path from "path";
import { mkdirSync } from "fs";

let dbInstance: Database.Database | null = null;

export function initDb(dbPath: string, forceNew = false): Database.Database {
  if (dbInstance && !forceNew) return dbInstance;
  if (dbInstance && forceNew) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }

  const dir = path.dirname(dbPath);
  mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS seen_items (
      id            TEXT PRIMARY KEY,
      source_id     TEXT NOT NULL,
      title         TEXT NOT NULL,
      url           TEXT NOT NULL,
      status        TEXT NOT NULL CHECK(status IN ('selected','ignored','reported')),
      reason        TEXT CHECK(reason IN ('duplicate','keyword_miss','cap_exceeded','llm_ignore','llm_risk','llm_unknown') OR reason IS NULL),
      first_seen_at TEXT NOT NULL,
      last_seen_at  TEXT NOT NULL,
      report_slug   TEXT,
      reported_at   TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id                  TEXT PRIMARY KEY,
      source_id           TEXT NOT NULL,
      title               TEXT NOT NULL,
      url                 TEXT NOT NULL,
      slug                TEXT NOT NULL,
      summary             TEXT,
      matched_categories  TEXT NOT NULL DEFAULT '[]',
      matched_keywords    TEXT NOT NULL DEFAULT '[]',
      prefilter_score     REAL NOT NULL DEFAULT 0,
      source_weight       REAL NOT NULL DEFAULT 1,
      rank_score          REAL NOT NULL DEFAULT 0,
      decision            TEXT CHECK(decision IN ('ADOPT_NOW','SPIKE','WATCH','IGNORE','BLOCKED_BY_RISK','UNKNOWN') OR decision IS NULL),
      llm_score           REAL,
      relevance_reason    TEXT,
      workflow_connection TEXT,
      skeptical_notes     TEXT,
      suggested_action    TEXT,
      created_at          TEXT NOT NULL,
      judged_at           TEXT
    );
  `);

  dbInstance = db;
  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return dbInstance;
}
