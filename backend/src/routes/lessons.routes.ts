import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { findUserByAuth } from '../utils/findUser';
import { recordUserActivity } from '../utils/streak';
import { saveUser } from '../utils/persistUser';
import { toPublicUser } from '../utils/publicUser';
import { awardActivity } from '../services/gamification.service';
import { findSimilarLessons } from '../services/rag.service';
const router = Router();

router.get('/search', async (req, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) {
      res.json({ lessons: [] });
      return;
    }
    const lessons = await findSimilarLessons(q, { limit: 10 });
    res.json({ lessons });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    const user = req.user ? await findUserByAuth(req) : null;

    const enriched = lessons.map((lesson) => ({
      ...lesson,
      recommended: lesson.tags?.includes('india') ?? false,
    }));

    res.json({ lessons: enriched, userGrade: user?.grade ?? null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});
router.get('/daily', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    const level = user?.targetLevel ?? 'beginner';

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );

    const lessons = await prisma.lesson.findMany({
      where: { isActive: true, level },
      orderBy: { order: 'asc' },
    });
    const dailyLesson = lessons[dayOfYear % lessons.length] ?? lessons[0];

    res.json({ lesson: dailyLesson, dayOfYear });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily lesson' });
  }
});

router.get('/:id', async (req, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: String(req.params.id) } });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    res.json({ lesson });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { score = 80, minutesSpent = 10, heartsRemaining, correctCount, totalExercises } = req.body;
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: String(req.params.id) } });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    await prisma.progress.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        minutesSpent,
        score,
        activityType: 'lesson',
        metadata: { heartsRemaining, correctCount, totalExercises },
      },
    });

    recordUserActivity(user, minutesSpent);
    user.lessonsCompleted += 1;
    const rewards = awardActivity(user, 'lesson', score);
    const updated = await saveUser(user);

    res.json({ user: toPublicUser(updated), rewards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

export default router;
