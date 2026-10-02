import { DbItem, DbMatch, sqliteDb } from '../db.js';
import { DEFAULT_WEIGHTS, MatchCriteriaWeights, MatchFactorBreakdown, IImageSimilarityProvider } from './types.js';
import { computeCategorySimilarity, computeDescriptionSimilarity } from './textSimilarity.js';
import { computeLocationSimilarity } from './locationSimilarity.js';
import { computeTimeSimilarity } from './timeSimilarity.js';
import { defaultImageProvider, VectorImageSimilarityProvider } from './imageSimilarity.js';
import { embeddingService } from './embeddings/embeddingService.js';

export class MatchCalculator {
  private weights: MatchCriteriaWeights;
  private imageProvider: IImageSimilarityProvider;

  constructor(weights: MatchCriteriaWeights = DEFAULT_WEIGHTS, imageProvider: IImageSimilarityProvider = defaultImageProvider) {
    this.weights = weights;
    this.imageProvider = imageProvider;
  }

  setImageProvider(provider: IImageSimilarityProvider) {
    this.imageProvider = provider;
  }

  async computeScore(lostItem: DbItem, foundItem: DbItem): Promise<MatchFactorBreakdown> {
    const reasons: string[] = [];

    // 1. AI-Based Image Similarity (Weight: 40%)
    const imgDetails = await embeddingService.computeImageSimilarity(lostItem, foundItem);
    const image_similarity = imgDetails.imageSimilarity;

    // Prominently highlight image similarity
    reasons.push(`Potential Match – ${Math.round(image_similarity)}% image similarity`);
    if (imgDetails.reasons && imgDetails.reasons.length > 0) {
      reasons.push(...imgDetails.reasons);
    }

    // 2. Location Similarity (Weight: 25%)
    const locResult = computeLocationSimilarity(lostItem, foundItem);
    const location_similarity = locResult.score;
    reasons.push(...locResult.reasons);

    // 3. Time / Date Similarity (Weight: 20%)
    const timeResult = computeTimeSimilarity(lostItem, foundItem);
    const time_similarity = timeResult.score;
    reasons.push(...timeResult.reasons);

    // 4. Description Similarity (Weight: 15%)
    const descResult = computeDescriptionSimilarity(lostItem, foundItem);
    const description_similarity = descResult.score;
    reasons.push(...descResult.reasons);

    // 5. Category Similarity Check
    const catResult = computeCategorySimilarity(lostItem, foundItem);
    const category_similarity = catResult.score;
    if (catResult.reason) reasons.push(catResult.reason);

    // Final Match Score = 40% image similarity + 25% location similarity + 20% date/time similarity + 15% description similarity
    let rawScore = (
      (image_similarity * this.weights.imageWeight) +
      (location_similarity * this.weights.locationWeight) +
      (time_similarity * this.weights.timeWeight) +
      (description_similarity * this.weights.descriptionWeight)
    );

    // Category relevance penalty if completely unrelated categories
    if (category_similarity < 40) {
      rawScore = rawScore * 0.4;
    }

    const final_match_score = Math.round(Math.min(100, Math.max(0, rawScore)) * 10) / 10;

    return {
      category_similarity,
      image_similarity,
      location_similarity,
      time_similarity,
      description_similarity,
      final_match_score,
      reasons,
      imageDetails: imgDetails.details,
      modelName: imgDetails.modelName,
      isAiVisualMatch: imgDetails.isAiGenerated,
    };
  }

  /**
   * Find and persist potential matches for an item in the SQLite database
   */
  async findAndSaveMatches(item: DbItem): Promise<DbMatch[]> {
    const isLost = item.type === 'lost';
    const candidateType = isLost ? 'found' : 'lost';

    const candidates = sqliteDb.getItems({
      type: candidateType,
    }).filter(c => c.id !== item.id && c.status !== 'closed' && c.status !== 'returned');

    const createdMatches: DbMatch[] = [];

    for (const candidate of candidates) {
      const lostItem = isLost ? item : candidate;
      const foundItem = isLost ? candidate : item;

      const breakdown = await this.computeScore(lostItem, foundItem);

      // Score threshold to qualify as a Potential Match
      if (breakdown.final_match_score >= 30) {
        const matchRecord: DbMatch = {
          id: `match_${lostItem.id}_${foundItem.id}`,
          lost_item_id: lostItem.id,
          found_item_id: foundItem.id,
          image_similarity: breakdown.image_similarity,
          location_similarity: breakdown.location_similarity,
          time_similarity: breakdown.time_similarity,
          description_similarity: breakdown.description_similarity,
          final_match_score: breakdown.final_match_score,
          status: 'potential',
          reasons: JSON.stringify(breakdown.reasons),
          created_at: new Date().toISOString(),
        };

        sqliteDb.saveMatch(matchRecord);
        createdMatches.push(matchRecord);
      }
    }

    return createdMatches.sort((a, b) => b.final_match_score - a.final_match_score);
  }
}

export const matchCalculator = new MatchCalculator();
