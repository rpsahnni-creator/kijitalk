import { prisma } from '../config/prisma';
import { answerMatches } from '../utils/answerMatch';

/** Days until the next review after a correct answer, by Leitner box (index = new box). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MASTERED_BOX = BOX_INTERVAL_DAYS.length - 1;

/** Next box and review time: correct moves up a box, a miss starts over tomorrow. */
export function scheduleReview(box: number, correct: boolean, now = new Date()): { box: number; nextReviewAt: Date } {
  const next = correct ? Math.min(MASTERED_BOX, box + 1) : 0;
  const days = correct ? BOX_INTERVAL_DAYS[next] : 1;
  return { box: next, nextReviewAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000) };
}

export async function dueReviews(userId: string, limit = 10) {
  return prisma.mistakeLog.findMany({
    where: { userId, nextReviewAt: { lte: new Date() }, box: { lt: MASTERED_BOX } },
    orderBy: [{ box: 'asc' }, { nextReviewAt: 'asc' }],
    take: limit,
    select: { id: true, original: true, topic: true, box: true, reviewCount: true },
  });
}

export async function reviewStats(userId: string) {
  const [due, total, mastered] = await Promise.all([
    prisma.mistakeLog.count({ where: { userId, nextReviewAt: { lte: new Date() }, box: { lt: MASTERED_BOX } } }),
    prisma.mistakeLog.count({ where: { userId } }),
    prisma.mistakeLog.count({ where: { userId, box: MASTERED_BOX } }),
  ]);
  return { due, total, mastered };
}

/** Grades one review answer and reschedules the card. */
export async function submitReview(userId: string, id: string, answer: string) {
  const card = await prisma.mistakeLog.findFirst({ where: { id, userId } });
  if (!card) return null;
  const correct = answerMatches(answer, card.corrected);
  const next = scheduleReview(card.box, correct);
  await prisma.mistakeLog.update({
    where: { id: card.id },
    data: { box: next.box, nextReviewAt: next.nextReviewAt, lastReviewedAt: new Date(), reviewCount: { increment: 1 } },
  });
  return { correct, expected: card.corrected, box: next.box, nextReviewAt: next.nextReviewAt, mastered: next.box === MASTERED_BOX };
}
