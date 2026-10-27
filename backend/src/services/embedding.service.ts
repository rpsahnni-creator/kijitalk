import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const EMBEDDING_MODEL = 'text-embedding-004';

/** Embeds a string into a 768-dim vector. Returns null on any failure — callers must degrade gracefully. */
export async function embedText(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(trimmed);
    return result.embedding.values;
  } catch (error) {
    logger.warn('Embedding request failed, continuing without it', error);
    return null;
  }
}
