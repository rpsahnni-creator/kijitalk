import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { embedText } from '../services/embedding.service';
import { lessonEmbeddingText } from '../services/rag.service';

export async function embedLessons(): Promise<{ embedded: number; skipped: number; failed: number }> {
  const lessons = await prisma.lesson.findMany({
    where: { embedding: { isEmpty: true } },
  });

  let embedded = 0;
  let failed = 0;

  for (const lesson of lessons) {
    const vector = await embedText(lessonEmbeddingText(lesson));
    if (!vector) {
      failed++;
      continue;
    }
    await prisma.lesson.update({ where: { id: lesson.id }, data: { embedding: vector } });
    embedded++;
  }

  const skipped = await prisma.lesson.count({ where: { embedding: { isEmpty: false } } }) - embedded;

  logger.info(`✅ Embedded ${embedded} lessons, ${failed} failed, ${skipped} already had embeddings`);
  return { embedded, skipped, failed };
}

if (require.main === module) {
  embedLessons()
    .then(() => prisma.$disconnect())
    .catch((error) => {
      logger.error('Embedding backfill failed:', error);
      process.exit(1);
    });
}
