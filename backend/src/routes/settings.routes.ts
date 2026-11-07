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
    const { darkMode, notifications, dailyGoalMinutes, voiceSpeed, accent, hindiLabels } = req.body ?? {};
    if (typeof darkMode === 'boolean') settings.darkMode = darkMode;
    if (typeof notifications === 'boolean') settings.notifications = notifications;
    if (typeof hindiLabels === 'boolean') settings.hindiLabels = hindiLabels;
    if (typeof dailyGoalMinutes === 'number' && Number.isFinite(dailyGoalMinutes)) {
      settings.dailyGoalMinutes = Math.min(120, Math.max(5, Math.round(dailyGoalMinutes)));
    }
    if (typeof voiceSpeed === 'number' && Number.isFinite(voiceSpeed)) {
      settings.voiceSpeed = Math.min(1.5, Math.max(0.5, Math.round(voiceSpeed * 10) / 10));
    }
    if (accent === 'indian' || accent === 'british' || accent === 'american') settings.accent = accent;

    await saveUser({ ...user, settings } as unknown as User);
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
