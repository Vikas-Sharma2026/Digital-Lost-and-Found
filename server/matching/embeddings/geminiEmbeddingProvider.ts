import { GoogleGenAI } from '@google/genai';
import { IImageEmbeddingProvider, EmbeddingInput } from './types.js';

export class GeminiImageEmbeddingProvider implements IImageEmbeddingProvider {
  readonly name = 'Google Gemini Multimodal Embedding Engine';
  readonly modelId = 'gemini-embedding-2-preview';
  readonly dimensions = 3072;
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI();
      } catch (err) {
        console.error('Failed to initialize GoogleGenAI client:', err);
        this.ai = null;
      }
    }
  }

  isConfigured(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  }

  /**
   * Converts a data URL or remote image URL into base64url and standard mimeType
   */
  private async resolveImageData(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') return null;

      // Handle Data URL (e.g. data:image/jpeg;base64,...)
      if (imageUrl.startsWith('data:')) {
        const match = imageUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const rawBase64 = match[2];
          const base64url = Buffer.from(rawBase64, 'base64').toString('base64url');
          return { data: base64url, mimeType };
        }
      }

      // Handle HTTP/HTTPS URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Campus-LostAndFound-AI/1.0',
            Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          console.warn(`Failed to fetch image ${imageUrl}: status ${res.status}`);
          return null;
        }

        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        // Limit size to 4MB for embedding API efficiency
        if (buffer.length > 4 * 1024 * 1024) {
          console.warn('Image exceeds 4MB limit for embedding, proceeding with text context');
          return null;
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const cleanMime = contentType.split(';')[0].trim();
        const base64url = buffer.toString('base64url');
        return { data: base64url, mimeType: cleanMime };
      }

      return null;
    } catch (err: any) {
      console.warn('Image extraction failed:', err?.message || err);
      return null;
    }
  }

  async generateEmbedding(input: EmbeddingInput): Promise<number[]> {
    if (!this.ai) {
      this.initClient();
    }

    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured or invalid');
    }

    const parts: any[] = [];

    // Text context: item title, category, description
    const textContext = [
      `Campus Item: ${input.title || 'Unknown Item'}`,
      input.category ? `Category: ${input.category}` : '',
      input.description ? `Description: ${input.description}` : '',
    ].filter(Boolean).join('. ');

    if (textContext) {
      parts.push({ text: textContext });
    }

    // Image context if available
    if (input.imageUrl) {
      const imageData = await this.resolveImageData(input.imageUrl);
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType,
          },
        });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: 'Generic unidentified object' });
    }

    try {
      const response = await this.ai.models.embedContent({
        model: this.modelId,
        contents: {
          parts,
        },
      });

      const vector = response.embeddings?.[0]?.values;
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new Error('Empty vector returned from Gemini Embeddings API');
      }

      return vector;
    } catch (err: any) {
      console.error('Error generating Gemini multimodal embedding:', err?.message || err);
      throw err;
    }
  }
}
