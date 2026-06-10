import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDb } from "../src/storage/db.js";
import { isSeen, markSeen, getSeenHashes, touchSeen, updateSeenStatus, getSeenById } from "../src/storage/seenStore.js";
import { upsertCandidate, updateCandidateJudgement, findCandidatesByQuery, getCandidatesByDate } from "../src/storage/candidateStore.js";
import { unlinkSync } from "fs";
import { CandidateItem } from "../src/types.js";

const TEST_DB_PATH = "./data/test-obio-radar.sqlite";

describe("database and storage repositories", () => {
  let db: any;

  beforeEach(() => {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch {}
    db = initDb(TEST_DB_PATH, true);
  });

  afterEach(() => {
    if (db) {
      try {
        db.close();
      } catch {}
    }
    try {
      unlinkSync(TEST_DB_PATH);
    } catch {}
  });

  it("performs seenStore operations", () => {
    const hash = "abc123hash";
    expect(isSeen(db, hash)).toBe(false);

    markSeen(db, {
      id: hash,
      sourceId: "test-src",
      title: "Test Title",
      url: "https://test.com",
      status: "selected",
      firstSeenAt: "2026-06-10T00:00:00Z",
      lastSeenAt: "2026-06-10T00:00:00Z"
    });

    expect(isSeen(db, hash)).toBe(true);

    const hashes = getSeenHashes(db, [hash, "not-seen"]);
    expect(hashes.has(hash)).toBe(true);
    expect(hashes.has("not-seen")).toBe(false);

    touchSeen(db, hash, "2026-06-10T01:00:00Z");
    const item = getSeenById(db, hash);
    expect(item?.lastSeenAt).toBe("2026-06-10T01:00:00Z");

    updateSeenStatus(db, hash, { status: "reported", reportSlug: "test-slug", reportedAt: "2026-06-10T02:00:00Z" });
    const updated = getSeenById(db, hash);
    expect(updated?.status).toBe("reported");
    expect(updated?.reportSlug).toBe("test-slug");
  });

  it("performs candidateStore operations", () => {
    const candidate: CandidateItem = {
      contentHash: "candidatehash",
      sourceId: "src-id",
      sourceName: "Source Name",
      sourceWeight: 1.2,
      title: "Title Here",
      url: "https://url.com",
      publishedAt: "2026-06-10T00:00:00Z",
      summary: "Short Summary",
      slug: "title-here",
      normalizedAt: "2026-06-10T00:00:00Z",
      matchedKeywords: ["mcp"],
      matchedCategories: ["mcp-server"],
      prefilterScore: 0.5,
      rankScore: 0.6
    };

    upsertCandidate(db, candidate);
    let results = findCandidatesByQuery(db, "title");
    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("title-here");

    updateCandidateJudgement(db, "candidatehash", {
      decision: "SPIKE",
      llmScore: 8,
      relevanceReason: "Ly do",
      workflowConnection: "Lien ket",
      skepticalNotes: "Nghi ngo",
      suggestedAction: "Hanh dong",
      judgedAt: "2026-06-10T03:00:00Z"
    });

    const judged = getCandidatesByDate(db, "2026-06-10");
    expect(judged).toHaveLength(1);
    expect(judged[0]?.decision).toBe("SPIKE");
    expect(judged[0]?.llmScore).toBe(8);
  });
});
