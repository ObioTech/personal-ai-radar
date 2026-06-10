import Database from "better-sqlite3";
import { CandidateItem, DecisionLabel } from "../types.js";

export interface CandidateRow extends CandidateItem {
  decision: DecisionLabel | null;
  llmScore: number | null;
  relevanceReason: string | null;
  workflowConnection: string | null;
  skepticalNotes: string | null;
  suggestedAction: string | null;
  createdAt: string;
  judgedAt: string | null;
}

export function upsertCandidate(db: Database.Database, candidate: CandidateItem): void {
  db.prepare(`
    INSERT INTO candidates (
      id, source_id, title, url, slug, summary,
      matched_categories, matched_keywords, prefilter_score, source_weight, rank_score, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      url = excluded.url,
      slug = excluded.slug,
      summary = excluded.summary,
      matched_categories = excluded.matched_categories,
      matched_keywords = excluded.matched_keywords,
      prefilter_score = excluded.prefilter_score,
      source_weight = excluded.source_weight,
      rank_score = excluded.rank_score
  `).run(
    candidate.contentHash,
    candidate.sourceId,
    candidate.title,
    candidate.url,
    candidate.slug,
    candidate.summary,
    JSON.stringify(candidate.matchedCategories),
    JSON.stringify(candidate.matchedKeywords),
    candidate.prefilterScore,
    candidate.sourceWeight,
    candidate.rankScore,
    candidate.normalizedAt
  );
}

export function upsertCandidates(db: Database.Database, candidates: CandidateItem[]): void {
  const stmt = db.prepare(`
    INSERT INTO candidates (
      id, source_id, title, url, slug, summary,
      matched_categories, matched_keywords, prefilter_score, source_weight, rank_score, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      url = excluded.url,
      slug = excluded.slug,
      summary = excluded.summary,
      matched_categories = excluded.matched_categories,
      matched_keywords = excluded.matched_keywords,
      prefilter_score = excluded.prefilter_score,
      source_weight = excluded.source_weight,
      rank_score = excluded.rank_score
  `);

  const transaction = db.transaction((items: CandidateItem[]) => {
    for (const candidate of items) {
      stmt.run(
        candidate.contentHash,
        candidate.sourceId,
        candidate.title,
        candidate.url,
        candidate.slug,
        candidate.summary,
        JSON.stringify(candidate.matchedCategories),
        JSON.stringify(candidate.matchedKeywords),
        candidate.prefilterScore,
        candidate.sourceWeight,
        candidate.rankScore,
        candidate.normalizedAt
      );
    }
  });

  transaction(candidates);
}

export function updateCandidateJudgement(
  db: Database.Database,
  id: string,
  judgement: {
    decision: DecisionLabel;
    llmScore: number;
    relevanceReason: string;
    workflowConnection: string;
    skepticalNotes: string;
    suggestedAction: string;
    judgedAt: string;
  }
): void {
  db.prepare(`
    UPDATE candidates
    SET decision = ?,
        llm_score = ?,
        relevance_reason = ?,
        workflow_connection = ?,
        skeptical_notes = ?,
        suggested_action = ?,
        judged_at = ?
    WHERE id = ?
  `).run(
    judgement.decision,
    judgement.llmScore,
    judgement.relevanceReason,
    judgement.workflowConnection,
    judgement.skepticalNotes,
    judgement.suggestedAction,
    judgement.judgedAt,
    id
  );
}

function toCandidateRow(row: any): CandidateRow {
  return {
    contentHash: row.id,
    sourceId: row.source_id,
    sourceName: "", // default value
    sourceWeight: row.source_weight,
    title: row.title,
    url: row.url,
    publishedAt: row.created_at,
    summary: row.summary ?? "",
    slug: row.slug,
    normalizedAt: row.created_at,
    matchedCategories: JSON.parse(row.matched_categories),
    matchedKeywords: JSON.parse(row.matched_keywords),
    prefilterScore: row.prefilter_score,
    rankScore: row.rank_score,
    decision: row.decision,
    llmScore: row.llm_score,
    relevanceReason: row.relevance_reason,
    workflowConnection: row.workflow_connection,
    skepticalNotes: row.skeptical_notes,
    suggestedAction: row.suggested_action ?? "",
    createdAt: row.created_at,
    judgedAt: row.judged_at,
  };
}

export function findCandidatesByQuery(db: Database.Database, query: string): CandidateRow[] {
  const rows = db.prepare(`
    SELECT * FROM candidates
    WHERE slug LIKE ? OR title LIKE ?
    ORDER BY rank_score DESC, created_at DESC
    LIMIT 10
  `).all(`%${query}%`, `%${query}%`) as any[];

  return rows.map(toCandidateRow);
}

export function getCandidatesByDate(db: Database.Database, date: string): CandidateRow[] {
  const rows = db.prepare(`
    SELECT * FROM candidates
    WHERE created_at LIKE ?
    ORDER BY rank_score DESC, created_at DESC
  `).all(`${date}%`) as any[];

  return rows.map(toCandidateRow);
}
