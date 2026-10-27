import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { toPublicUser } from '../utils/publicUser';
import { awardActivity, useStreakFreeze } from '../services/gamification.service';

const router = Router();

router.get('/leaderboard', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const leaders = await prisma.user.findMany({
      where: { lastActiveAt: { gte: weekAgo } },
      orderBy: [{ xp: 'desc' }, { streak: 'desc' }],
      take: 20,
      select: { displayName: true, xp: true, streak: true, level: true, badges: true },
    });

    res.json({
      leaderboard: leaders.map((u, i) => ({
        rank: i + 1,
        displayName: u.displayName,
        xp: u.xp,
        streak: u.streak,
        level: u.level,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/shop', (_req, res: Response) => {
  res.json({
    items: [
      { id: 'streak_freeze', name: 'Streak Freeze', cost: 100, description: 'Miss 1 day without losing streak' },
      { id: 'avatar_gold', name: 'Gold Avatar Ring', cost: 250, description: 'Premium avatar border' },
      { id: 'theme_ocean', name: 'Ocean Theme', cost: 150, description: 'Calm blue dashboard theme' },
    ],
  });
});

router.post('/shop/buy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { itemId } = req.body as { itemId: string };
    const prices: Record<string, { cost: number; apply: () => void }> = {
      streak_freeze: {
        cost: 100,
        apply: () => {
          user.streakFreezes += 1;
        },
      },
      avatar_gold: {
        cost: 250,
        apply: () => {
          if (!user.badges.includes('avatar_gold')) user.badges.push('avatar_gold');
        },
      },
      theme_ocean: {
        cost: 150,
        apply: () => {
          if (!user.badges.includes('theme_ocean')) user.badges.push('theme_ocean');
        },
      },
    };

    const item = prices[itemId];
    if (!item) {
      res.status(400).json({ error: 'Unknown item' });
      return;
    }
    if (user.coins < item.cost) {
      res.status(400).json({ error: 'Not enough coins' });
      return;
    }

    user.coins -= item.cost;
    item.apply();
    const updated = await saveUser(user);

    res.json({ user: toPublicUser(updated), purchased: itemId });
  } catch {
    res.status(500).json({ error: 'Purchase failed' });
  }
});

router.post('/streak-freeze', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const ok = useStreakFreeze(user);
    if (!ok) {
      res.status(400).json({ error: 'No streak freezes left' });
      return;
    }
    const updated = await saveUser(user);
    res.json({ user: toPublicUser(updated) });
  } catch {
    res.status(500).json({ error: 'Failed to use streak freeze' });
  }
});

router.post('/award', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { activity, score } = req.body as { activity: 'lesson' | 'chat' | 'roleplay' | 'voice' | 'call' | 'debate'; score?: number };
    const result = awardActivity(user, activity, score ?? 80);
    const updated = await saveUser(user);
    res.json({ user: toPublicUser(updated), ...result });
  } catch {
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

export default router;
