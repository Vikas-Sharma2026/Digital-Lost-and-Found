import { DbItem } from '../db.js';

export interface MatchCriteriaWeights {
  imageWeight: number;       // default 0.40 (40%)
  locationWeight: number;    // default 0.25 (25%)
  timeWeight: number;        // default 0.20 (20%)
  descriptionWeight: number; // default 0.15 (15%)
}

export const DEFAULT_WEIGHTS: MatchCriteriaWeights = {
  imageWeight: 0.40,
  locationWeight: 0.25,
  timeWeight: 0.20,
  descriptionWeight: 0.15,
};

export interface MatchFactorBreakdown {
  category_similarity: number;
  image_similarity: number;
  location_similarity: number;
  time_similarity: number;
  description_similarity: number;
  final_match_score: number;
  reasons: string[];
  imageDetails?: string;
  modelName?: string;
  isAiVisualMatch?: boolean;
}

export interface PotentialMatchItem {
  id: string;
  lostItem: DbItem;
  foundItem: DbItem;
  candidateItem: DbItem; // The counterpart item being compared
  breakdown: MatchFactorBreakdown;
  final_match_score: number;
  reasons: string[];
  status: 'potential' | 'verified' | 'dismissed';
}

/**
 * Modular Image Similarity Engine interface.
 * Connects to Gemini Multimodal Embeddings and Vector Similarity.
 */
export interface IImageSimilarityProvider {
  name: string;
  computeSimilarity(lostItem: DbItem, foundItem: DbItem): Promise<number> | number;
}
