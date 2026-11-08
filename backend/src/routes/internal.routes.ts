import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { eraseLearner } from '../services/account.service';
import { evictProfile } from '../middleware/auth';
import { logger } from '../utils/logger';

// Server-to-server endpoints for auth-service only. Never exposed to apps:
// every call must carry the shared INTERNAL_API_KEY.
const router = Router();

function requireInternalKey(req: Request, res: Response, next: NextFunction): void {
  const given = req.header('x-internal-key') ?? '';
  const expected = env.INTERNAL_API_KEY ?? '';
  const ok =
    expected.length >= 32 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.use(requireInternalKey);

// POST /internal/accounts/delete { email } — called by auth-service before it
// deletes the login. Idempotent: an unknown email is already "deleted".
router.post('/accounts/delete', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  try {
    const erased = await eraseLearner(email);
    evictProfile(email);
    res.json({ deleted: true, existed: erased });
  } catch (error) {
    logger.error('Internal account erase failed', error);
    res.status(500).json({ error: 'Erase failed' });
  }
});

export default router;
