import { Router, Response } from 'express';
import type { User } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { asSettings } from '../types/settings';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ settings: asSettings(user.settings) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const settings = asSettings(user.settings);
    const { darkMode, notifications, dailyGoalMinutes, voiceSpeed, accent } = req.body;
    if (darkMode !== undefined) settings.darkMode = darkMode;
    if (notifications !== undefined) settings.notifications = notifications;
    if (dailyGoalMinutes !== undefined) settings.dailyGoalMinutes = dailyGoalMinutes;
    if (voiceSpeed !== undefined) settings.voiceSpeed = voiceSpeed;
    if (accent !== undefined) settings.accent = accent;

    await saveUser({ ...user, settings } as unknown as User);
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
