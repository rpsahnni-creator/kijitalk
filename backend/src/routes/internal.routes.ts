import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { eraseLearner } from '../services/account.service';
import { evictProfile } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { sendStreakReminders, withJobLock } from '../jobs/streakReminders';
import { cancelRazorpaySubscription, isRazorpayConfigured } from '../services/payment.service';

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
    // Stop any renewal first so a deleted learner is never charged again.
    const profile = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (profile && isRazorpayConfigured()) {
      const live = await prisma.subscription.findMany({
        where: { userId: profile.id, status: { in: ['created', 'authenticated', 'active', 'pending'] } },
      });
      for (const sub of live) {
        await cancelRazorpaySubscription(sub.razorpaySubscriptionId, false).catch((error) =>
          logger.error(`Could not cancel subscription ${sub.razorpaySubscriptionId} during erase`, error)
        );
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled', cancelledAt: new Date() } });
      }
    }
    const erased = await eraseLearner(email);
    evictProfile(email);
    res.json({ deleted: true, existed: erased });
  } catch (error) {
    logger.error('Internal account erase failed', error);
    res.status(500).json({ error: 'Erase failed' });
  }
});

// POST /internal/jobs/streak-reminders — for an external cron (e.g. daily 7:30 pm IST)
// when the in-process scheduler is off.
router.post('/jobs/streak-reminders', async (_req: Request, res: Response) => {
  try {
    const sent = await withJobLock(() => sendStreakReminders());
    res.json({ ran: sent !== null, sent: sent ?? 0 });
  } catch (error) {
    logger.error('Streak reminder job failed', error);
    res.status(500).json({ error: 'Job failed' });
  }
});

// GET /internal/reports/weekly?email= — last 7 days of practice, for the
// parent report email that auth-service sends (it holds parent emails/consent).
router.get('/reports/weekly', async (req: Request, res: Response) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || user.deletedAt) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [activity, mistakes] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: user.id, date: { gte: since } },
      select: { date: true, minutesSpent: true, score: true, activityType: true },
    }),
    prisma.mistakeLog.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { original: true, corrected: true },
    }),
  ]);
  const days = new Set(activity.map((a) => a.date.toISOString().slice(0, 10)));
  const scored = activity.filter((a) => a.score > 0);
  res.json({
    displayName: user.displayName,
    streak: user.streak,
    minutes: activity.reduce((sum, a) => sum + a.minutesSpent, 0),
    activeDays: days.size,
    lessonsCompleted: activity.filter((a) => a.activityType === 'lesson').length,
    avgScore: scored.length ? Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length) : null,
    recentCorrections: mistakes,
  });
});

export default router;
