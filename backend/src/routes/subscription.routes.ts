import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { checkAiUsage } from '../services/subscription.service';
import { PLANS } from '../config/plans';
import { env } from '../config/env';

const router = Router();

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const usage = checkAiUsage(user);
    res.json({ tier: user.subscriptionTier, usage, plans: PLANS });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.get('/plans', (_req, res: Response) => {
  res.json({ plans: PLANS });
});

// Dev-only: lets us (and the user, locally) flip a tier to test premium behavior
// without a real payment gateway wired up yet. Never enabled in production.
if (env.NODE_ENV !== 'production') {
  router.post('/dev-set-tier', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await findUserByAuth(req);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const { tier } = req.body as { tier?: 'free' | 'premium' };
      if (tier !== 'free' && tier !== 'premium') {
        res.status(400).json({ error: 'tier must be "free" or "premium"' });
        return;
      }
      const updated = await saveUser({ ...user, subscriptionTier: tier });
      res.json({ tier: updated.subscriptionTier });
    } catch (error) {
      res.status(500).json({ error: 'Failed to set tier' });
    }
  });
}

export default router;
