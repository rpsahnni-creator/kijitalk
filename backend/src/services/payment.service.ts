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
