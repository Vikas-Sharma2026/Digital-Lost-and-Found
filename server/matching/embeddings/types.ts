export interface EmbeddingInput {
  itemId?: string;
  title: string;
  category?: string;
  description: string;
  imageUrl?: string;
}

export interface ImageSimilarityResult {
  imageSimilarity: number;       // 0 - 100 percentage
  rawCosine: number;             // -1.0 to 1.0 (or 0.0 to 1.0)
  modelName: string;             // e.g. "gemini-embedding-2-preview"
  dimensions: number;            // e.g. 3072
  isAiGenerated: boolean;        // true if real Gemini multimodal embedding was computed
  details: string;               // Human-readable summary
  reasons: string[];             // Specific visual observations
}

export interface IImageEmbeddingProvider {
  readonly name: string;
  readonly modelId: string;
  readonly dimensions: number;
  isConfigured(): boolean;
  generateEmbedding(input: EmbeddingInput): Promise<number[]>;
}

export interface VectorEmbeddingRecord {
  itemId: string;
  vector: number[];
  model: string;
  dimensions: number;
}
