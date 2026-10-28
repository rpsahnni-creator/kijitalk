import { Router, Response, Request } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { checkAiUsage, effectiveTier } from '../services/subscription.service';
import {
  createPremiumOrder,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/payment.service';
import { PLANS } from '../config/plans';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

const router = Router();

/** A premium purchase always buys 30 days from today, stacked onto any time still remaining. */
function extendSubscription(currentExpiresAt: Date | null, currentTier: 'free' | 'premium'): Date {
  const now = new Date();
  const base = currentTier === 'premium' && currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt;
}

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const usage = checkAiUsage(user);
    res.json({
      tier: effectiveTier(user),
      expiresAt: user.subscriptionExpiresAt,
      usage,
      plans: PLANS,
      paymentsEnabled: isRazorpayConfigured(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.get('/plans', (_req, res: Response) => {
  res.json({ plans: PLANS });
});

// Starts a Razorpay order for the premium plan. The client opens Razorpay
// Checkout with this order, then confirms the result via POST /verify.
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isRazorpayConfigured()) {
      res.status(503).json({ error: 'Payments abhi configure nahi hain. Thodi der baad try karo.' });
      return;
    }
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const plan = PLANS.premium;
    const order = await createPremiumOrder(plan.priceInr, `premium_${user.id}_${Date.now()}`);
    await prisma.payment.create({
      data: { userId: user.id, razorpayOrderId: order.id, amountInr: plan.priceInr },
    });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      name: 'KijiTalk Premium',
      description: plan.priceLabel,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start checkout' });
  }
});

// Confirms a Checkout payment client-side signature and upgrades the user.
// The webhook below is the backup path if the client never calls this
// (closed tab, crash, etc).
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: 'Missing payment verification fields' });
      return;
    }
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
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
    }
    const expiresAt = extendSubscription(user.subscriptionExpiresAt, effectiveTier(user));
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: expiresAt },
    });
    res.json({ tier: updated.subscriptionTier, expiresAt: updated.subscriptionExpiresAt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Razorpay server-to-server webhook — upgrades the user even if the client
// never calls /verify. Configure this URL + a webhook secret in the
// Razorpay dashboard; RAZORPAY_WEBHOOK_SECRET must match.
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !req.rawBody || !verifyWebhookSignature(req.rawBody, signature)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }
    const event = JSON.parse(req.rawBody.toString('utf8'));
    if (event.event === 'payment.captured') {
      const orderId = event.payload?.payment?.entity?.order_id as string | undefined;
      const paymentId = event.payload?.payment?.entity?.id as string | undefined;
      const payment = orderId
        ? await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } })
        : null;
      if (payment && payment.status !== 'paid') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'paid', razorpayPaymentId: paymentId },
        });
        const user = await prisma.user.findUnique({ where: { id: payment.userId } });
        if (user) {
          const expiresAt = extendSubscription(user.subscriptionExpiresAt, effectiveTier(user));
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionTier: 'premium', subscriptionExpiresAt: expiresAt },
          });
        }
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
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
