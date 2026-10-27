import type { Lesson, MistakeLog } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { embedText } from './embedding.service';
import { cosineSimilarity } from '../utils/similarity';

export function lessonEmbeddingText(lesson: {
  title: string;
  description: string;
  category: string;
  vocabulary: string[];
  phrases: string[];
}): string {
  return [
    lesson.title,
    lesson.description,
    lesson.category,
    lesson.vocabulary.join(', '),
    lesson.phrases.join(' '),
  ]
    .filter(Boolean)
    .join('\n');
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'about', 'that', 'this', 'from', 'your', 'you',
  'have', 'has', 'are', 'was', 'were', 'how', 'what', 'when', 'where', 'who',
  'mujhe', 'mera', 'meri', 'main', 'hai', 'chahiye', 'wala', 'wali',
]);

function significantWords(queryText: string): string[] {
  const words = queryText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return words.length > 0 ? words : [queryText];
}

async function fallbackLessonSearch(queryText: string, limit: number, category?: string): Promise<Lesson[]> {
  const words = significantWords(queryText);

  return prisma.lesson.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      OR: words.flatMap((word) => [
        { title: { contains: word, mode: 'insensitive' as const } },
        { description: { contains: word, mode: 'insensitive' as const } },
        { category: { contains: word, mode: 'insensitive' as const } },
        { tags: { has: word } },
      ]),
    },
    take: limit,
  });
}

export async function findSimilarLessons(
  queryText: string,
  opts: { category?: string; limit?: number } = {}
): Promise<Lesson[]> {
  const limit = opts.limit ?? 5;

  try {
    const queryEmbedding = await embedText(queryText);
    if (!queryEmbedding) {
      return fallbackLessonSearch(queryText, limit, opts.category);
    }

    const candidates = await prisma.lesson.findMany({
      where: {
        isActive: true,
        embedding: { isEmpty: false },
        ...(opts.category ? { category: { contains: opts.category, mode: 'insensitive' } } : {}),
      },
    });

    if (candidates.length === 0) {
      return fallbackLessonSearch(queryText, limit, opts.category);
    }

    return candidates
      .map((lesson) => ({ lesson, score: cosineSimilarity(queryEmbedding, lesson.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.lesson);
  } catch (error) {
    logger.warn('findSimilarLessons failed, returning empty result', error);
    return [];
  }
}

export async function findRelevantMistakes(
  userId: string,
  queryText: string,
  limit = 3
): Promise<MistakeLog[]> {
  try {
    const recent = await prisma.mistakeLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (recent.length === 0) return [];

    const queryEmbedding = await embedText(queryText);
    if (!queryEmbedding) {
      // No embedding available — fall back to the user's most recent mistakes, which is
      // still useful personalization even without semantic ranking.
      return recent.slice(0, limit);
    }

    const withEmbedding = recent.filter((m) => m.embedding.length > 0);
    if (withEmbedding.length === 0) return recent.slice(0, limit);

    return withEmbedding
      .map((m) => ({ mistake: m, score: cosineSimilarity(queryEmbedding, m.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.mistake);
  } catch (error) {
    logger.warn('findRelevantMistakes failed, returning empty result', error);
    return [];
  }
}

export async function logMistakesFromCorrections(userId: string, corrections: string[]): Promise<void> {
  for (const correction of corrections) {
    try {
      const parts = correction.split('→');
      if (parts.length < 2) continue;
      const original = parts[0].trim();
      const corrected = parts.slice(1).join('→').trim();
      if (!original || !corrected) continue;

      const embedding = (await embedText(original)) ?? [];
      await prisma.mistakeLog.create({
        data: { userId, original, corrected, embedding },
      });
    } catch (error) {
      logger.warn('Failed to log a mistake correction, skipping it', error);
    }
  }
}
