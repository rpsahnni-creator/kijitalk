import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { findUserByAuth } from '../utils/findUser';
import { recordUserActivity, getTodayMinutes } from '../utils/streak';
import { saveUser } from '../utils/persistUser';
import { getDailyPhrase } from '../data/dailyPhrases';
const router = Router();

router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const progressRecords = await prisma.progress.findMany({
      where: { userId: user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const dailyStats = buildDailyStats(progressRecords);
    const activityBreakdown = buildActivityBreakdown(progressRecords);
    const avgScore =
      progressRecords.length > 0
        ? Math.round(
            progressRecords.reduce((sum, p) => sum + p.score, 0) / progressRecords.length
          )
        : 0;

    const todayMinutes = getTodayMinutes(progressRecords);
    const settings = (user.settings as { dailyGoalMinutes?: number }) ?? {};

    res.json({
      stats: {
        streak: user.streak,
        totalMinutes: user.totalMinutes,
        todayMinutes,
        lessonsCompleted: user.lessonsCompleted,
        avgScore,
        dailyGoal: settings.dailyGoalMinutes ?? 15,
        xp: user.xp,
        coins: user.coins,
        level: user.level,
        badges: user.badges,
        streakFreezes: user.streakFreezes,
      },
      dailyPhrase: getDailyPhrase(),
      dailyStats,
      activityBreakdown,
      recentActivity: progressRecords.slice(-10).reverse(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

router.post('/record', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { minutesSpent, score, activityType, pronunciationScore, metadata } = req.body;

    const record = await prisma.progress.create({
      data: {
        userId: user.id,
        minutesSpent: minutesSpent ?? 1,
        score: score ?? 0,
        pronunciationScore,
        activityType: activityType ?? 'voice',
        metadata,
      },
    });

    recordUserActivity(user, minutesSpent ?? 1);
    await saveUser(user);
    res.status(201).json({ record });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

function buildDailyStats(records: Array<{ date: Date; minutesSpent: number; score: number }>) {
  const map = new Map<string, { minutes: number; score: number; count: number }>();

  for (const r of records) {
    const key = r.date.toISOString().split('T')[0];
    const existing = map.get(key) ?? { minutes: 0, score: 0, count: 0 };
    existing.minutes += r.minutesSpent;
    existing.score += r.score;
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    minutes: data.minutes,
    avgScore: Math.round(data.score / data.count),
  }));
}

function buildActivityBreakdown(records: Array<{ activityType: string }>) {
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.activityType] = (counts[r.activityType] ?? 0) + 1;
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export default router;
