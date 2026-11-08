import { Router, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth';
import { evictProfile } from '../middleware/auth';
import { isAdmin } from '../middleware/admin';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { effectiveTier } from '../services/subscription.service';
import { eraseLearner } from '../services/account.service';
import { isRazorpayConfigured, refundRazorpayPayment } from '../services/payment.service';
import {
  AuthServiceError,
  callAuthAdmin,
  extendGrant,
  logAdminAction,
  refundablePaise,
  stopRenewals,
  type AuthAccountStatus,
} from '../services/adminUser.service';

// Mounted inside admin.routes, so authMiddleware + requireAdmin already ran.
const router = Router();
const DAY = 24 * 60 * 60 * 1000;

const PROFILE_SELECT = {
  id: true,
  email: true,
  displayName: true,
  nativeLanguage: true,
  targetLevel: true,
  grade: true,
  board: true,
  state: true,
  learningGoal: true,
  onboardingCompleted: true,
  subscriptionTier: true,
  subscriptionExpiresAt: true,
  schoolLicenseUntil: true,
  premiumGrantUntil: true,
  aiMessagesToday: true,
  aiUsageResetAt: true,
  streak: true,
  totalMinutes: true,
  lessonsCompleted: true,
  xp: true,
  level: true,
  coins: true,
  placementScore: true,
  placementAt: true,
  lastActiveAt: true,
  createdAt: true,
  deletedAt: true,
  suspendedAt: true,
  suspendedReason: true,
} satisfies Prisma.UserSelect;

// GET /api/admin/users/:id — everything support needs about one learner.
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.params.id) }, select: PROFILE_SELECT });
    if (!user) {
      res.status(404).json({ error: 'Learner nahi mila' });
      return;
    }
    const since30 = new Date(Date.now() - 30 * DAY);
    const since7 = new Date(Date.now() - 7 * DAY);
    const [subscriptions, payments, aiByFeature, aiTotal30, recentActivity, minutes7, classes, mistakes, reviewDue, audit, account] =
      await Promise.all([
        prisma.subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
        prisma.payment.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          include: { invoice: { select: { id: true, number: true } } },
        }),
        prisma.aiUsageLog.groupBy({ by: ['feature'], where: { userId: user.id, createdAt: { gte: since30 } }, _count: true }),
        prisma.aiUsageLog.count({ where: { userId: user.id, createdAt: { gte: since30 } } }),
        prisma.progress.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
          take: 10,
          select: { id: true, date: true, activityType: true, minutesSpent: true, score: true, lesson: { select: { title: true } } },
        }),
        prisma.progress.aggregate({ where: { userId: user.id, date: { gte: since7 } }, _sum: { minutesSpent: true } }),
        prisma.classMember.findMany({
          where: { userId: user.id },
          select: { joinedAt: true, classroom: { select: { id: true, name: true, school: { select: { name: true } } } } },
        }),
        prisma.mistakeLog.count({ where: { userId: user.id } }),
        prisma.mistakeLog.count({ where: { userId: user.id, nextReviewAt: { lte: new Date() } } }),
        prisma.adminAuditLog.findMany({ where: { targetUserId: user.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
        user.deletedAt
          ? Promise.resolve<AuthAccountStatus | null>({ exists: false })
          : callAuthAdmin(user.email, 'status').catch((error) => {
              logger.warn('Admin: could not load auth status', error);
              return null;
            }),
      ]);

    const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    res.json({
      user,
      isAdmin: isAdmin(user.email),
      tier: effectiveTier(fullUser),
      premiumSource: premiumSource(fullUser),
      account,
      stats: {
        minutes7d: minutes7._sum.minutesSpent ?? 0,
        aiCalls30d: aiTotal30,
        aiByFeature: aiByFeature.map((a) => ({ feature: a.feature, count: a._count })),
        mistakes,
        reviewDue,
      },
      subscriptions,
      payments: payments.map((p) => ({ ...p, refundablePaise: refundablePaise(p) })),
      classes: classes.map((c) => ({ id: c.classroom.id, name: c.classroom.name, school: c.classroom.school.name, joinedAt: c.joinedAt })),
      recentActivity: recentActivity.map((a) => ({ ...a, lesson: a.lesson?.title ?? null })),
      audit,
      razorpayConfigured: isRazorpayConfigured(),
    });
  } catch (error) {
    logger.error('Admin user detail failed', error);
    res.status(500).json({ error: 'Learner ki details load nahi ho payi' });
  }
});

function premiumSource(u: { subscriptionTier: string; subscriptionExpiresAt: Date | null; schoolLicenseUntil: Date | null; premiumGrantUntil: Date | null }) {
  const now = new Date();
  const sources: string[] = [];
  if (u.subscriptionTier === 'premium' && (!u.subscriptionExpiresAt || u.subscriptionExpiresAt > now)) sources.push('subscription');
  if (u.schoolLicenseUntil && u.schoolLicenseUntil > now) sources.push('school');
  if (u.premiumGrantUntil && u.premiumGrantUntil > now) sources.push('admin_grant');
  return sources;
}

const reason = z.string().trim().min(3, 'Wajah likho (kam se kam 3 akshar)').max(500);
const optionalReason = z.string().trim().max(500).optional();
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('suspend'), reason }),
  z.object({ action: z.literal('unsuspend'), reason: optionalReason }),
  z.object({ action: z.literal('logout_all'), reason: optionalReason }),
  z.object({ action: z.literal('grant_premium'), days: z.number().int().min(1).max(365), reason }),
  z.object({ action: z.literal('revoke_premium'), reason }),
  z.object({ action: z.literal('reset_ai_usage'), reason: optionalReason }),
  z.object({ action: z.literal('send_password_reset') }),
  z.object({ action: z.literal('mark_verified'), reason: optionalReason }),
  z.object({ action: z.literal('resend_verification') }),
  z.object({ action: z.literal('resend_parent_consent') }),
  z.object({ action: z.literal('cancel_subscription'), immediately: z.boolean().default(false), reason }),
  z.object({
    action: z.literal('refund'),
    paymentId: z.string().min(1),
    amountInr: z.number().positive().max(100000).optional(),
    reason,
  }),
  z.object({ action: z.literal('delete'), confirmEmail: z.string().trim().toLowerCase(), reason }),
]);
type AdminAction = z.infer<typeof actionSchema>;

// Actions that would lock an admin out or erase them are refused on admin accounts.
const NOT_ON_ADMINS = new Set<AdminAction['action']>(['suspend', 'delete']);

// POST /api/admin/users/:id/actions — one support action, always audited.
router.post('/users/:id/actions', async (req: AuthRequest, res: Response) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Galat request' });
    return;
  }
  const input = parsed.data;
  const adminEmail = req.user!.email;
  const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
  if (!user || user.deletedAt) {
    res.status(404).json({ error: 'Learner nahi mila (ya delete ho chuka hai)' });
    return;
  }
  if (NOT_ON_ADMINS.has(input.action) && (isAdmin(user.email) || user.email === adminEmail.toLowerCase())) {
    res.status(400).json({ error: 'Admin account pe yeh action nahi ho sakta. Pehle ADMIN_EMAILS se hatao.' });
    return;
  }

  try {
    const result = await applyAction(input, user);
    await logAdminAction({
      adminEmail,
      action: input.action,
      targetUserId: user.id,
      targetEmail: user.email,
      reason: 'reason' in input ? input.reason : null,
      details: result.details,
    });
    res.json({ ok: true, message: result.message });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    logger.error(`Admin action ${input.action} failed`, error);
    res.status(500).json({ error: 'Action fail ho gaya. Logs check karo.' });
  }
});

type UserRow = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

async function applyAction(input: AdminAction, user: UserRow): Promise<{ message: string; details?: Prisma.InputJsonValue }> {
  switch (input.action) {
    case 'suspend': {
      await callAuthAdmin(user.email, 'suspend');
      await prisma.user.update({ where: { id: user.id }, data: { suspendedAt: new Date(), suspendedReason: input.reason } });
      evictProfile(user.email);
      return { message: 'Account suspend ho gaya aur sab devices se logout kar diya.' };
    }
    case 'unsuspend': {
      await callAuthAdmin(user.email, 'unsuspend');
      await prisma.user.update({ where: { id: user.id }, data: { suspendedAt: null, suspendedReason: null } });
      evictProfile(user.email);
      return { message: 'Account phir se active hai.' };
    }
    case 'logout_all':
      await callAuthAdmin(user.email, 'logout_all');
      return { message: 'Sab devices se logout ho gaya (15 minute mein har jagah).' };
    case 'grant_premium': {
      const until = extendGrant(user.premiumGrantUntil, input.days);
      await prisma.user.update({ where: { id: user.id }, data: { premiumGrantUntil: until } });
      return { message: `${input.days} din ka Premium de diya (${until.toLocaleDateString('en-IN')} tak).`, details: { days: input.days, until: until.toISOString() } };
    }
    case 'revoke_premium':
      await prisma.user.update({ where: { id: user.id }, data: { premiumGrantUntil: null } });
      return { message: 'Admin wala Premium hata diya. (Paid subscription ya school licence pe asar nahi.)' };
    case 'reset_ai_usage':
      await prisma.user.update({ where: { id: user.id }, data: { aiMessagesToday: 0, aiUsageResetAt: new Date() } });
      return { message: 'Aaj ka AI message count 0 kar diya.', details: { previous: user.aiMessagesToday } };
    case 'send_password_reset':
      await callAuthAdmin(user.email, 'send_password_reset');
      return { message: 'Password reset link email kar diya.' };
    case 'mark_verified':
      await callAuthAdmin(user.email, 'mark_verified');
      return { message: 'Email verified mark kar diya.' };
    case 'resend_verification':
      await callAuthAdmin(user.email, 'resend_verification');
      return { message: 'Verification email dobara bhej diya.' };
    case 'resend_parent_consent':
      await callAuthAdmin(user.email, 'resend_parent_consent');
      return { message: 'Parent ko consent email dobara bhej diya.' };
    case 'cancel_subscription': {
      const stopped = await stopRenewals(user.id, input.immediately);
      if (stopped === 0) throw new AuthServiceError('Koi chalu subscription nahi hai.', 409);
      return {
        message: input.immediately ? 'Subscription turant band — Premium abhi khatam.' : 'Renewal band — Premium paid period ke end tak chalega.',
        details: { stopped, immediately: input.immediately },
      };
    }
    case 'refund': {
      const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, userId: user.id } });
      if (!payment?.razorpayPaymentId) throw new AuthServiceError('Yeh payment is learner ka nahi hai ya capture nahi hua.', 404);
      const left = refundablePaise(payment);
      const amountPaise = input.amountInr ? Math.round(input.amountInr * 100) : left;
      if (left === 0) throw new AuthServiceError('Is payment pe refund ke liye kuch nahi bacha.', 409);
      if (amountPaise > left) throw new AuthServiceError(`Zyada se zyada ₹${(left / 100).toFixed(2)} refund ho sakta hai.`, 400);
      if (!isRazorpayConfigured()) throw new AuthServiceError('Razorpay configure nahi hai, refund nahi ho sakta.', 503);
      const refund = await refundRazorpayPayment(payment.razorpayPaymentId, amountPaise, { reason: input.reason.slice(0, 250), learner: user.id });
      const refundedPaise = payment.refundedPaise + amountPaise;
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayRefundId: refund.id,
          refundedPaise,
          refundedAt: new Date(),
          status: refundedPaise >= payment.amountInr * 100 ? 'refunded' : payment.status,
        },
      });
      return {
        message: `₹${(amountPaise / 100).toFixed(2)} refund shuru ho gaya (Razorpay ${refund.id}). Bank mein 5–7 din lagte hain.`,
        details: { paymentId: payment.id, refundId: refund.id, amountPaise },
      };
    }
    case 'delete': {
      if (input.confirmEmail !== user.email) throw new AuthServiceError('Confirm ke liye learner ka email bilkul sahi likho.', 400);
      // Same order as a learner's own request: stop billing, erase the profile, then the login.
      await stopRenewals(user.id, true).catch((error) => {
        if (error instanceof AuthServiceError && error.status === 503) return 0;
        throw error;
      });
      await eraseLearner(user.email);
      evictProfile(user.email);
      await callAuthAdmin(user.email, 'delete');
      return { message: 'Account aur learning data delete ho gaya. Payment/invoice record GST ke liye rakhe gaye hain.' };
    }
  }
}

// GET /api/admin/audit?page=&q= — the admin activity log.
router.get('/audit', async (req: AuthRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 50;
  const where: Prisma.AdminAuditLogWhereInput = q
    ? {
        OR: [
          { targetEmail: { contains: q, mode: 'insensitive' } },
          { adminEmail: { contains: q, mode: 'insensitive' } },
          { action: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};
  const [total, entries] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  res.json({ total, page, pageSize, entries });
});

export default router;
