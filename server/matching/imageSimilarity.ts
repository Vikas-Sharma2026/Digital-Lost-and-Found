import { DbItem } from '../db.js';
import { IImageSimilarityProvider } from './types.js';
import { embeddingService } from './embeddings/embeddingService.js';
import { ImageSimilarityResult } from './embeddings/types.js';

/**
 * AI-Based Image Similarity Provider using Gemini Multimodal Vector Embeddings
 * and Cosine Vector Similarity.
 */
export class VectorImageSimilarityProvider implements IImageSimilarityProvider {
  name = 'AI Multimodal Vector Similarity Provider';

  async computeSimilarity(lostItem: DbItem, foundItem: DbItem): Promise<number> {
    const result = await embeddingService.computeImageSimilarity(lostItem, foundItem);
    return result.imageSimilarity;
  }

  async computeDetailedSimilarity(lostItem: DbItem, foundItem: DbItem): Promise<ImageSimilarityResult> {
    return await embeddingService.computeImageSimilarity(lostItem, foundItem);
  }
}

export const vectorImageProvider = new VectorImageSimilarityProvider();
export const defaultImageProvider = vectorImageProvider;
