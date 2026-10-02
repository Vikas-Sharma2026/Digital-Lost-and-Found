/**
 * Computes standard Cosine Similarity between two N-dimensional numerical vectors.
 * Returns a value in range [-1.0, 1.0].
 */
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const rawCosine = dotProduct / denominator;
  // Numerical clamp
  return Math.max(-1, Math.min(1, rawCosine));
}

/**
 * Calibrates raw cosine similarity from embedding space into an intuitive 0-100% similarity score.
 * Gemini Multimodal embeddings typically cluster in [0.15, 0.85] for heterogeneous cross-modal data.
 */
export function cosineToSimilarityPercentage(rawCosine: number): number {
  if (rawCosine <= 0) return 10;

  // Linear scaling with baseline calibration:
  // Baseline random match threshold ~0.20 maps to ~30%
  // Moderate similarity ~0.50 maps to ~75%
  // High similarity ~0.65+ maps to ~90-95%
  let score: number;
  if (rawCosine < 0.20) {
    score = (rawCosine / 0.20) * 35;
  } else if (rawCosine < 0.50) {
    score = 35 + ((rawCosine - 0.20) / (0.50 - 0.20)) * 40; // 35 -> 75
  } else if (rawCosine < 0.70) {
    score = 75 + ((rawCosine - 0.50) / (0.70 - 0.50)) * 16; // 75 -> 91
  } else {
    score = 91 + ((rawCosine - 0.70) / (1.0 - 0.70)) * 9;   // 91 -> 100
  }

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}
