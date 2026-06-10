import Database from "better-sqlite3";
import { SeenStatus, DiscardReason } from "../types.js";

export interface SeenRow {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  status: SeenStatus;
  reason: DiscardReason | null;
  firstSeenAt: string;
  lastSeenAt: string;
  reportSlug: string | null;
  reportedAt: string | null;
}

export function isSeen(db: Database.Database, contentHash: string): boolean {
  const row = db.prepare("SELECT 1 FROM seen_items WHERE id = ?").get(contentHash);
  return !!row;
}

export function getSeenHashes(db: Database.Database, hashes: string[]): Set<string> {
  if (hashes.length === 0) return new Set();
  const placeholders = hashes.map(() => "?").join(",");
  const rows = db.prepare(`SELECT id FROM seen_items WHERE id IN (${placeholders})`).all(...hashes) as { id: string }[];
  return new Set(rows.map((r) => r.id));
}

export function markSeen(
  db: Database.Database,
  item: {
    id: string;
    sourceId: string;
    title: string;
    url: string;
    status: SeenStatus;
    reason?: DiscardReason;
    firstSeenAt: string;
    lastSeenAt: string;
  }
): void {
  db.prepare(`
    INSERT INTO seen_items (id, source_id, title, url, status, reason, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      reason = excluded.reason,
      last_seen_at = excluded.last_seen_at
  `).run(
    item.id,
    item.sourceId,
    item.title,
    item.url,
    item.status,
    item.reason ?? null,
    item.firstSeenAt,
    item.lastSeenAt
  );
}

export function touchSeen(db: Database.Database, id: string, lastSeenAt: string): void {
  db.prepare("UPDATE seen_items SET last_seen_at = ? WHERE id = ?").run(lastSeenAt, id);
}

export function updateSeenStatus(
  db: Database.Database,
  id: string,
  updates: {
    status: SeenStatus;
    reportSlug?: string;
    reportedAt?: string;
  }
): void {
  db.prepare(`
    UPDATE seen_items
    SET status = ?,
        report_slug = COALESCE(?, report_slug),
        reported_at = COALESCE(?, reported_at)
    WHERE id = ?
  `).run(
    updates.status,
    updates.reportSlug ?? null,
    updates.reportedAt ?? null,
    id
  );
}

export function getSeenById(db: Database.Database, id: string): SeenRow | null {
  const row = db.prepare(`
    SELECT
      id,
      source_id as sourceId,
      title,
      url,
      status,
      reason,
      first_seen_at as firstSeenAt,
      last_seen_at as lastSeenAt,
      report_slug as reportSlug,
      reported_at as reportedAt
    FROM seen_items
    WHERE id = ?
  `).get(id) as SeenRow | undefined;
  return row ?? null;
}
