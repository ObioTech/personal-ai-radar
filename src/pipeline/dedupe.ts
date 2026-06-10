import Database from "better-sqlite3";
import { CandidateItem } from "../types.js";
import { getSeenHashes, touchSeen } from "../storage/seenStore.js";
import { nowISO } from "../utils/date.js";

export function dedupeItems(
  db: Database.Database,
  items: CandidateItem[]
): {
  newItems: CandidateItem[];
  duplicates: CandidateItem[];
} {
  const hashes = items.map((item) => item.contentHash);
  const seenHashes = getSeenHashes(db, hashes);

  const newItems: CandidateItem[] = [];
  const duplicates: CandidateItem[] = [];

  const now = nowISO();

  for (const item of items) {
    if (seenHashes.has(item.contentHash)) {
      duplicates.push(item);
      touchSeen(db, item.contentHash, now);
    } else {
      newItems.push(item);
    }
  }

  console.log(`[DEDUPE] Skipped ${duplicates.length} duplicate(s)`);

  return { newItems, duplicates };
}
