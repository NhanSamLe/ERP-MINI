import { Ollama } from 'ollama';
import OpenAI from 'openai';
import crypto from 'crypto';
import { env } from '../../../config/env';

const ollama = new Ollama({ host: env.ollama.host });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
});

export const EMBED_DIMENSIONS = 1024;

export class EmbeddingService {
  /**
   * Tạo vector từ text - Tự động chọn Ollama (development) hoặc OpenAI (production)
   */
  async embed(text: string): Promise<number[]> {
    const provider = process.env.RAG_PROVIDER || 'ollama';

    if (provider === 'openai') {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: EMBED_DIMENSIONS,
      });
      const firstResult = response.data[0];
      if (!firstResult) {
        throw new Error('OpenAI embedding result is empty');
      }
      return firstResult.embedding;
    } else {
      // Default to Ollama bge-m3
      const response = await ollama.embeddings({
        model: 'bge-m3',
        prompt: text,
      });
      return response.embedding;
    }
  }

  /**
   * Batch embed — xử lý nhiều text, có delay tránh quá tải
   */
  async embedBatch(
    texts: string[],
    delayMs = 50
  ): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    }
    return results;
  }

  /**
   * Hash nội dung để check thay đổi — tránh re-embed không cần thiết
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

export const embeddingService = new EmbeddingService();
