import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { saveUser } from '../utils/persistUser';
import { findUserByAuth } from '../utils/findUser';
import { toPublicUser } from '../utils/publicUser';

const router = Router();

// Sign-up, sign-in, Google, refresh, logout and password flows moved to
// auth-service (Django). Old app builds that still call these get a clear answer.
const MOVED = { error: 'Sign-in ab naye auth service se hota hai. App ko update/refresh karo.' };
for (const path of ['/register', '/login', '/google']) {
  router.post(path, (_req, res: Response) => {
    res.status(410).json(MOVED);
  });
}

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: { ...toPublicUser(user), emailVerified: req.user?.emailVerified ?? false } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const allowed = [
      'displayName',
      'avatarUrl',
      'nativeLanguage',
      'targetLevel',
      'grade',
      'board',
      'state',
      'learningGoal',
      'onboardingCompleted',
      'settings',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    const updated = await saveUser({ ...user, ...data });
    res.json({ user: toPublicUser(updated) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
