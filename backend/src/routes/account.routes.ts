import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { exportLearnerData } from '../services/account.service';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/account/export — the learner's own data as a JSON download.
// (Login details come from auth-service's /api/auth/account/export/; the apps
// merge both into one file.)
router.get('/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const data = await exportLearnerData(user);
    res.setHeader('Content-Disposition', 'attachment; filename="kijitalk-my-data.json"');
    res.json({ exportedAt: new Date().toISOString(), ...data });
  } catch (error) {
    logger.error('Data export failed', error);
    res.status(500).json({ error: 'Data export nahi ho paya. Dobara try karo.' });
  }
});

export default router;
