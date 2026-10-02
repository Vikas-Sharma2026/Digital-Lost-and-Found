import { DbItem, DbMatch, sqliteDb } from './db.js';
import { matchCalculator } from './matching/matchCalculator.js';
import { embeddingService } from './matching/embeddings/embeddingService.js';

export interface DetailedMatchScore {
  image_similarity: number;
  location_similarity: number;
  time_similarity: number;
  description_similarity: number;
  final_match_score: number;
  reasons: string[];
}

export async function computeItemMatchScore(lostItem: DbItem, foundItem: DbItem): Promise<DetailedMatchScore> {
  const breakdown = await matchCalculator.computeScore(lostItem, foundItem);
  return {
    image_similarity: breakdown.image_similarity,
    location_similarity: breakdown.location_similarity,
    time_similarity: breakdown.time_similarity,
    description_similarity: breakdown.description_similarity,
    final_match_score: breakdown.final_match_score,
    reasons: breakdown.reasons,
  };
}

export async function syncMatchesForItem(item: DbItem): Promise<DbMatch[]> {
  // Pre-generate embedding for the new item in background/sync
  try {
    await embeddingService.getOrGenerateItemEmbedding(item);
  } catch (e) {
    // continue
  }

  return await matchCalculator.findAndSaveMatches(item);
}
