import { DbItem, sqliteDb } from '../../db.js';
import { IImageEmbeddingProvider, ImageSimilarityResult } from './types.js';
import { GeminiImageEmbeddingProvider } from './geminiEmbeddingProvider.js';
import { LocalVisualFeatureProvider } from './localVisualFeatureProvider.js';
import { computeCosineSimilarity, cosineToSimilarityPercentage } from './vectorUtils.js';

export class EmbeddingService {
  private primaryProvider: IImageEmbeddingProvider;
  private fallbackProvider: IImageEmbeddingProvider;

  constructor() {
    this.primaryProvider = new GeminiImageEmbeddingProvider();
    this.fallbackProvider = new LocalVisualFeatureProvider();
  }

  /**
   * Returns current active provider status for frontend inspection
   */
  getStatus() {
    const isGeminiAvailable = this.primaryProvider.isConfigured();
    const activeProvider = isGeminiAvailable ? this.primaryProvider : this.fallbackProvider;
    const stored = sqliteDb.getAllItemEmbeddings();

    return {
      isGeminiAvailable,
      activeModel: activeProvider.modelId,
      providerName: activeProvider.name,
      dimensions: activeProvider.dimensions,
      vectorDatabase: 'SQLite item_embeddings table (JSON serialized float vectors)',
      storedEmbeddingsCount: stored.length,
      metric: 'Cosine Vector Similarity (Mapped to 0-100% Proximity Score)',
    };
  }

  /**
   * Sets custom primary embedding provider for modular extensibility
   */
  setPrimaryProvider(provider: IImageEmbeddingProvider) {
    this.primaryProvider = provider;
  }

  /**
   * Retrieves or computes and persists vector embedding for a given item
   */
  async getOrGenerateItemEmbedding(item: DbItem): Promise<{ vector: number[]; model: string; isAi: boolean }> {
    // 1. Check SQLite vector store first
    const cached = sqliteDb.getItemEmbedding(item.id);
    if (cached && cached.vector && cached.vector.length > 0) {
      return {
        vector: cached.vector,
        model: cached.model,
        isAi: cached.model === this.primaryProvider.modelId,
      };
    }

    // 2. Determine provider: prefer Gemini multimodal if key configured, otherwise fallback
    let vector: number[] | null = null;
    let modelUsed = '';
    let isAi = false;

    if (this.primaryProvider.isConfigured()) {
      try {
        vector = await this.primaryProvider.generateEmbedding({
          itemId: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          imageUrl: item.image_url,
        });
        modelUsed = this.primaryProvider.modelId;
        isAi = true;
      } catch (err: any) {
        console.warn(`Gemini embedding failed for item ${item.id}, falling back to local visual vectorizer:`, err?.message || err);
      }
    }

    // Fallback if Gemini failed or unconfigured
    if (!vector) {
      vector = await this.fallbackProvider.generateEmbedding({
        itemId: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        imageUrl: item.image_url,
      });
      modelUsed = this.fallbackProvider.modelId;
      isAi = false;
    }

    // 3. Persist to SQLite item_embeddings vector store
    try {
      sqliteDb.saveItemEmbedding(item.id, vector, modelUsed);
    } catch (saveErr) {
      console.error('Failed to persist vector embedding to SQLite:', saveErr);
    }

    return { vector, model: modelUsed, isAi };
  }

  /**
   * Computes visual & multimodal image similarity between Lost and Found items
   * using their AI vector embeddings and Cosine Similarity metric.
   */
  async computeImageSimilarity(lostItem: DbItem, foundItem: DbItem): Promise<ImageSimilarityResult> {
    const hasLostImg = Boolean(lostItem.image_url && lostItem.image_url.trim().length > 0);
    const hasFoundImg = Boolean(foundItem.image_url && foundItem.image_url.trim().length > 0);

    // Retrieve / compute embeddings for both items
    const [lostEmb, foundEmb] = await Promise.all([
      this.getOrGenerateItemEmbedding(lostItem),
      this.getOrGenerateItemEmbedding(foundItem),
    ]);

    const reasons: string[] = [];

    // Check dimensions match; if models differed (e.g. one fallback), re-embed to match
    let vecA = lostEmb.vector;
    let vecB = foundEmb.vector;
    let activeModel = lostEmb.model;
    let isAi = lostEmb.isAi && foundEmb.isAi;

    if (vecA.length !== vecB.length) {
      // Re-generate both using fallback for consistent dimensions
      vecA = await this.fallbackProvider.generateEmbedding({
        itemId: lostItem.id,
        title: lostItem.title,
        category: lostItem.category,
        description: lostItem.description,
        imageUrl: lostItem.image_url,
      });
      vecB = await this.fallbackProvider.generateEmbedding({
        itemId: foundItem.id,
        title: foundItem.title,
        category: foundItem.category,
        description: foundItem.description,
        imageUrl: foundItem.image_url,
      });
      activeModel = this.fallbackProvider.modelId;
      isAi = false;
    }

    const rawCosine = computeCosineSimilarity(vecA, vecB);
    let imageSimilarity = cosineToSimilarityPercentage(rawCosine);

    // Contextual annotations
    if (hasLostImg && hasFoundImg) {
      reasons.push(
        isAi
          ? `Gemini AI vector comparison computed ${Math.round(imageSimilarity)}% visual embedding similarity (cosine: ${rawCosine.toFixed(3)})`
          : `Photo visual characteristics match with ${Math.round(imageSimilarity)}% similarity`
      );
    } else if (hasLostImg || hasFoundImg) {
      reasons.push('Single photo report compared against textual & visual attributes');
      // Mild damping when only one party uploaded an image
      imageSimilarity = Math.round(imageSimilarity * 0.85);
    } else {
      reasons.push('No visual photo attached to reports (derived from description tokens)');
      imageSimilarity = Math.min(45, Math.round(imageSimilarity * 0.6));
    }

    const details = isAi
      ? `Model: ${activeModel} (${vecA.length}-D vector embedding). Cosine distance: ${(1 - rawCosine).toFixed(3)}.`
      : `Model: ${activeModel}. Visual proximity calculated from descriptive tokens.`;

    return {
      imageSimilarity: Math.round(imageSimilarity * 10) / 10,
      rawCosine,
      modelName: activeModel,
      dimensions: vecA.length,
      isAiGenerated: isAi,
      details,
      reasons,
    };
  }

  /**
   * Pre-embeds all existing items in database so matches are computed instantly
   */
  async preWarmDatabaseEmbeddings(): Promise<number> {
    const allItems = sqliteDb.getItems({});
    let count = 0;
    for (const item of allItems) {
      const existing = sqliteDb.getItemEmbedding(item.id);
      if (!existing) {
        try {
          await this.getOrGenerateItemEmbedding(item);
          count++;
        } catch (e) {
          // ignore
        }
      }
    }
    return count;
  }
}

export const embeddingService = new EmbeddingService();
