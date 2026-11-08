import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { prisma } from '../config/prisma';
import { similarityScore } from '../utils/answerMatch';
import { PLACEMENT_MCQ, PLACEMENT_SPEAKING, levelForScore } from '../data/placementTest';

const router = Router();
router.use(authMiddleware);

// GET /api/placement — the questions, without answers.
router.get('/', (_req: AuthRequest, res: Response) => {
  res.json({
    mcq: PLACEMENT_MCQ.map(({ answer: _answer, ...q }) => q),
    speaking: PLACEMENT_SPEAKING.map(({ id, sentence }) => ({ id, sentence })),
    minutes: 5,
  });
});

/** Weighted 0–100 score: MCQ 60%, speaking 40% (speaking is optional; then MCQ counts fully). */
export function scorePlacement(mcq: Record<string, number>, speaking: Record<string, string>) {
  const mcqMax = PLACEMENT_MCQ.reduce((s, q) => s + q.weight, 0);
  const mcqGot = PLACEMENT_MCQ.reduce((s, q) => s + (mcq[q.id] === q.answer ? q.weight : 0), 0);

  const spoken = PLACEMENT_SPEAKING.filter((q) => typeof speaking[q.id] === 'string' && speaking[q.id].trim());
  const speakMax = spoken.reduce((s, q) => s + q.weight, 0);
  const speakGot = spoken.reduce((s, q) => s + (similarityScore(speaking[q.id], q.sentence) / 100) * q.weight, 0);

  const mcqPct = mcqGot / mcqMax;
  const score = speakMax > 0 ? Math.round((mcqPct * 0.6 + (speakGot / speakMax) * 0.4) * 100) : Math.round(mcqPct * 100);
  return { score, level: levelForScore(score), correct: PLACEMENT_MCQ.filter((q) => mcq[q.id] === q.answer).length };
}

// POST /api/placement { mcq: { q1: 1, ... }, speaking: { s1: "transcript", ... } }
router.post('/', async (req: AuthRequest, res: Response) => {
  const user = await findUserByAuth(req);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const mcq = (req.body?.mcq ?? {}) as Record<string, number>;
  const speaking = (req.body?.speaking ?? {}) as Record<string, string>;
  const result = scorePlacement(mcq, speaking);

  await prisma.user.update({
    where: { id: user.id },
    data: { targetLevel: result.level, placementScore: result.score, placementAt: new Date() },
  });
  const path = await prisma.lesson.findMany({
    where: { isActive: true, level: result.level },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
    take: 5,
    select: { id: true, title: true, category: true, durationMinutes: true },
  });
  res.json({ ...result, total: PLACEMENT_MCQ.length, path });
});

export default router;
