import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export function isRazorpayConfigured(): boolean {
  return razorpay !== null;
}

export async function createPremiumOrder(amountInr: number, receipt: string) {
  if (!razorpay) throw new Error('Razorpay is not configured');
  return razorpay.orders.create({
    amount: amountInr * 100,
    currency: 'INR',
    receipt,
  });
}

function safeEqual(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex);
  const actual = Buffer.from(actualHex);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** Verifies the signature Razorpay Checkout returns to the client after a successful payment. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Verifies the `X-Razorpay-Signature` header on incoming webhook calls. */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

// ── Subscriptions (monthly Premium) ─────────────────────────────────────────

export function isSubscriptionConfigured(): boolean {
  return razorpay !== null && !!env.RAZORPAY_PLAN_ID;
}

/** Starts a Razorpay subscription on the Premium plan; the learner authorises it in Checkout. */
export async function createPremiumSubscription(notes: Record<string, string>) {
  if (!razorpay || !env.RAZORPAY_PLAN_ID) throw new Error('Razorpay subscriptions are not configured');
  return razorpay.subscriptions.create({
    plan_id: env.RAZORPAY_PLAN_ID,
    total_count: 120, // up to 10 years of monthly renewals; cancellable any time
    customer_notify: 1,
    notes,
  });
}

/** Stops renewals. With atCycleEnd the learner keeps Premium until the paid period ends. */
export async function cancelRazorpaySubscription(subscriptionId: string, atCycleEnd = true) {
  if (!razorpay) throw new Error('Razorpay is not configured');
  return razorpay.subscriptions.cancel(subscriptionId, atCycleEnd);
}

/** Verifies the signature Checkout returns after a subscription's first payment. */
export function verifySubscriptionSignature(paymentId: string, subscriptionId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Refunds a captured payment, fully or partly (amount in paise). */
export async function refundRazorpayPayment(paymentId: string, amountPaise: number, notes: Record<string, string>) {
  if (!razorpay) throw new Error('Razorpay is not configured');
  return razorpay.payments.refund(paymentId, { amount: amountPaise, speed: 'normal', notes });
}
