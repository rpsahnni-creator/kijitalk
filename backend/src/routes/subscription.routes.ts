import { Router, Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { checkAiUsage, effectiveTier } from '../services/subscription.service';
import {
  cancelRazorpaySubscription,
  createPremiumSubscription,
  isRazorpayConfigured,
  isSubscriptionConfigured,
  verifyPaymentSignature,
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from '../services/payment.service';
import { handleRazorpayEvent, syncSubscription } from '../services/billing.service';
import { invoiceLines, issueInvoiceForPayment } from '../services/invoice.service';
import { PLANS } from '../config/plans';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const router = Router();

const LIVE_STATUSES = ['created', 'authenticated', 'active', 'pending'] as const;

/** Legacy one-off purchase: 30 days from today, stacked onto any time still remaining. */
function extendSubscription(currentExpiresAt: Date | null, currentTier: 'free' | 'premium'): Date {
  const now = new Date();
  const base = currentTier === 'premium' && currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt;
}

async function liveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: [...LIVE_STATUSES] } },
    orderBy: { createdAt: 'desc' },
  });
}

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const sub = await liveSubscription(user.id);
    res.json({
      tier: effectiveTier(user),
      expiresAt: user.subscriptionExpiresAt,
      usage: checkAiUsage(user),
      plans: PLANS,
      paymentsEnabled: isSubscriptionConfigured(),
      subscription: sub && {
        status: sub.status,
        currentEnd: sub.currentEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.get('/plans', (_req, res: Response) => {
  res.json({ plans: PLANS });
});

// POST /subscribe — starts a monthly Premium subscription. The app opens
// Razorpay Checkout with the returned subscription id, then calls /verify.
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isSubscriptionConfigured()) {
      res.status(503).json({ error: 'Payments abhi configure nahi hain. Thodi der baad try karo.' });
      return;
    }
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const existing = await liveSubscription(user.id);
    if (existing && existing.status !== 'created') {
      res.status(409).json({ error: 'Aapka Premium subscription pehle se chal raha hai.' });
      return;
    }

    const sub = await createPremiumSubscription({ userId: user.id, email: user.email });
    await prisma.subscription.create({
      data: { userId: user.id, razorpaySubscriptionId: sub.id, planId: sub.plan_id, status: 'created' },
    });
    res.json({
      subscriptionId: sub.id,
      keyId: env.RAZORPAY_KEY_ID,
      name: 'KijiTalk Premium',
      description: `${PLANS.premium.priceLabel} · auto-renews monthly`,
    });
  } catch (error) {
    logger.error('Subscription start failed', error);
    res.status(500).json({ error: 'Subscription shuru nahi ho paya. Dobara try karo.' });
  }
});

// POST /verify — confirms the Checkout signature right after payment so the
// learner gets Premium immediately. Webhooks remain the source of truth for
// renewals and are the backup if this call never arrives.
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature } = req.body as Record<
      string,
      string | undefined
    >;
    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_subscription_id && !razorpay_order_id)) {
      res.status(400).json({ error: 'Missing payment verification fields' });
      return;
    }

    if (razorpay_subscription_id) {
      if (!verifySubscriptionSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature)) {
        res.status(400).json({ error: 'Payment verification failed' });
        return;
      }
      const sub = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: razorpay_subscription_id } });
      if (!sub || sub.userId !== user.id) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      await syncSubscription({
        id: sub.razorpaySubscriptionId,
        status: 'active',
        current_start: now,
        current_end: now + 30 * 24 * 60 * 60, // replaced by the exact period from the webhook
      });
      const payment = await prisma.payment.upsert({
        where: { razorpayPaymentId: razorpay_payment_id },
        create: {
          userId: user.id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySubscriptionId: sub.razorpaySubscriptionId,
          amountInr: PLANS.premium.priceInr,
          status: 'paid',
        },
        update: { status: 'paid' },
      });
      await issueInvoiceForPayment(payment.id);
    } else {
      // Legacy one-off order flow (older app builds).
      if (!verifyPaymentSignature(razorpay_order_id!, razorpay_payment_id, razorpay_signature)) {
        res.status(400).json({ error: 'Payment verification failed' });
        return;
      }
      const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
      if (!payment || payment.userId !== user.id) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      if (payment.status !== 'paid') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'paid', razorpayPaymentId: razorpay_payment_id },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'premium',
            subscriptionExpiresAt: extendSubscription(user.subscriptionExpiresAt, effectiveTier(user)),
          },
        });
      }
      await issueInvoiceForPayment(payment.id);
    }

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    res.json({ tier: updated ? effectiveTier(updated) : 'premium', expiresAt: updated?.subscriptionExpiresAt });
  } catch (error) {
    logger.error('Payment verification failed', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// POST /cancel — stop renewing; Premium continues until the paid period ends.
router.post('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const sub = await liveSubscription(user.id);
    if (!sub) {
      res.status(404).json({ error: 'Koi chalta hua subscription nahi mila.' });
      return;
    }
    if (isRazorpayConfigured()) await cancelRazorpaySubscription(sub.razorpaySubscriptionId, true);
    await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
    res.json({
      message: sub.currentEnd
        ? `Renewal band ho gaya. Premium ${sub.currentEnd.toLocaleDateString('en-IN')} tak chalega.`
        : 'Renewal band ho gaya.',
      currentEnd: sub.currentEnd,
    });
  } catch (error) {
    logger.error('Subscription cancel failed', error);
    res.status(500).json({ error: 'Cancel nahi ho paya. Dobara try karo.' });
  }
});

router.get('/invoices', authMiddleware, async (req: AuthRequest, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId: req.user!.uid },
    orderBy: { issuedAt: 'desc' },
    select: { id: true, number: true, issuedAt: true, totalPaise: true, description: true },
  });
  res.json({ invoices });
});

router.get('/invoices/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: String(req.params.id) } });
  if (!invoice || invoice.userId !== req.user!.uid) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json({ invoice, lines: invoiceLines(invoice), gstRatePercent: env.GST_RATE_PERCENT });
});

// Razorpay server-to-server webhook. Configure in the Razorpay dashboard with
// the events subscription.* and payment.captured; RAZORPAY_WEBHOOK_SECRET
// must match the secret set there.
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !req.rawBody || !verifyWebhookSignature(req.rawBody, signature)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }
    const event = JSON.parse(req.rawBody.toString('utf8'));
    const eventId = typeof req.headers['x-razorpay-event-id'] === 'string' ? req.headers['x-razorpay-event-id'] : undefined;

    // Legacy one-off orders.
    if (event.event === 'payment.captured' && event.payload?.payment?.entity?.order_id) {
      const entity = event.payload.payment.entity;
      const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
      if (payment && payment.status !== 'paid') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid', razorpayPaymentId: entity.id } });
        const user = await prisma.user.findUnique({ where: { id: payment.userId } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'premium',
              subscriptionExpiresAt: extendSubscription(user.subscriptionExpiresAt, effectiveTier(user)),
            },
          });
        }
        await issueInvoiceForPayment(payment.id);
      }
      res.json({ received: true });
      return;
    }

    const outcome = await handleRazorpayEvent(eventId, event);
    res.json({ received: true, outcome });
  } catch (error) {
    logger.error('Webhook processing failed', error);
    // 500 makes Razorpay retry later.
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Dev-only: flip a tier to test Premium without a payment gateway. Never in production.
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
