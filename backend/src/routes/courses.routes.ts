import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { findUserByAuth } from '../utils/findUser';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    const lessons = await prisma.lesson.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });

    const courseMap = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const key = `${lesson.category}-${lesson.level}`;
      const group = courseMap.get(key) ?? [];
      group.push(lesson);
      courseMap.set(key, group);
    }

    const courses = Array.from(courseMap.entries()).map(([key, group]) => {
      const first = group[0];
      return {
        id: key,
        title: `${first.category} · ${first.level}`,
        description: `${group.length} lessons for ${first.level} level ${first.category.toLowerCase()} practice`,
        level: first.level,
        category: first.category,
        lessonCount: group.length,
        progressPercent: user ? Math.min(100, Math.round((user.lessonsCompleted / group.length) * 100)) : 0,
        lessonIds: group.map((l) => l.id),
      };
    });

    res.json({ courses });
  } catch {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    const courseLessons = lessons.filter((l) => `${l.category}-${l.level}` === req.params.id);

    if (courseLessons.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const first = courseLessons[0];
    res.json({
      course: {
        id: req.params.id,
        title: `${first.category} · ${first.level}`,
        description: `${courseLessons.length} structured lessons`,
        level: first.level,
        category: first.category,
        lessonCount: courseLessons.length,
      },
      lessons: courseLessons,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

export default router;
