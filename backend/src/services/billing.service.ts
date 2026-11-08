import type { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { issueInvoiceForPayment } from './invoice.service';

/** Subset of Razorpay's subscription entity that billing relies on. */
export interface RzpSubscription {
  id: string;
  status: string;
  plan_id?: string;
  current_start?: number | null;
  current_end?: number | null;
  notes?: Record<string, string> | unknown[];
}

export interface RzpPayment {
  id: string;
  amount: number; // paise
  status?: string;
  order_id?: string | null;
}

const STATUSES: SubscriptionStatus[] = [
  'created',
  'authenticated',
  'active',
  'pending',
  'halted',
  'cancelled',
  'completed',
  'expired',
];

// A renewal payment can arrive a little after the period ends; don't cut
// Premium off in that gap.
const GRACE_MS = 24 * 60 * 60 * 1000;

export function toStatus(raw: string): SubscriptionStatus {
  return (STATUSES as string[]).includes(raw) ? (raw as SubscriptionStatus) : 'pending';
}

const fromUnix = (s?: number | null) => (s ? new Date(s * 1000) : null);

/** Premium is granted while a subscription is live; the end of the paid period plus grace. */
export function premiumUntil(status: SubscriptionStatus, currentEnd: Date | null): Date | null {
  if (!currentEnd) return null;
  if (status === 'active' || status === 'authenticated' || status === 'pending') {
    return new Date(currentEnd.getTime() + GRACE_MS);
  }
  // Cancelled/halted/completed: keep what was already paid for, nothing more.
  return currentEnd;
}

async function ownerOf(sub: RzpSubscription): Promise<string | null> {
  const row = await prisma.subscription.findUnique({ where: { razorpaySubscriptionId: sub.id } });
  if (row) return row.userId;
  const notes = sub.notes && !Array.isArray(sub.notes) ? sub.notes : {};
  return typeof notes.userId === 'string' ? notes.userId : null;
}

/** Mirrors a Razorpay subscription into our tables and the learner's Premium access. */
export async function syncSubscription(sub: RzpSubscription, cancelled = false): Promise<void> {
  const userId = await ownerOf(sub);
  if (!userId) {
    logger.warn(`Subscription ${sub.id} has no known owner; ignoring`);
    return;
  }
  const status = toStatus(sub.status);
  const currentStart = fromUnix(sub.current_start);
  const currentEnd = fromUnix(sub.current_end);
  const ended = status === 'cancelled' || status === 'completed' || status === 'expired' || status === 'halted';

  await prisma.subscription.upsert({
    where: { razorpaySubscriptionId: sub.id },
    create: {
      userId,
      razorpaySubscriptionId: sub.id,
      planId: sub.plan_id ?? '',
      status,
      currentStart,
      currentEnd,
      cancelledAt: ended || cancelled ? new Date() : null,
    },
    update: {
      status,
      ...(currentStart ? { currentStart } : {}),
      ...(currentEnd ? { currentEnd } : {}),
      ...(ended ? { cancelledAt: new Date() } : {}),
    },
  });

  const until = premiumUntil(status, currentEnd);
  if (until) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Never shorten time the learner already has (e.g. from an older one-off purchase).
    const keep = user?.subscriptionExpiresAt && user.subscriptionExpiresAt > until ? user.subscriptionExpiresAt : until;
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: keep },
    });
  }
}

/** Records a successful subscription charge (first payment or renewal) and issues its GST invoice. */
export async function recordSubscriptionCharge(sub: RzpSubscription, payment: RzpPayment): Promise<void> {
  const userId = await ownerOf(sub);
  if (!userId) {
    logger.warn(`Charge ${payment.id} for unknown subscription ${sub.id}; ignoring`);
    return;
  }
  const row = await prisma.payment.upsert({
    where: { razorpayPaymentId: payment.id },
    create: {
      userId,
      razorpayPaymentId: payment.id,
      razorpaySubscriptionId: sub.id,
      amountInr: Math.round(payment.amount / 100),
      status: 'paid',
    },
    update: { status: 'paid' },
  });
  await syncSubscription(sub);
  await issueInvoiceForPayment(row.id);
}

/**
 * Applies one verified Razorpay webhook event. Event ids are stored first, so
 * a retried delivery is acknowledged without being processed twice.
 */
export async function handleRazorpayEvent(eventId: string | undefined, event: {
  event: string;
  payload?: {
    subscription?: { entity: RzpSubscription };
    payment?: { entity: RzpPayment };
  };
}): Promise<'processed' | 'duplicate' | 'ignored'> {
  if (eventId) {
    try {
      await prisma.webhookEvent.create({ data: { id: eventId, event: event.event } });
    } catch {
      return 'duplicate';
    }
  }

  const sub = event.payload?.subscription?.entity;
  const payment = event.payload?.payment?.entity;

  switch (event.event) {
    case 'subscription.charged':
      if (sub && payment) await recordSubscriptionCharge(sub, payment);
      return 'processed';
    case 'subscription.authenticated':
    case 'subscription.activated':
    case 'subscription.pending':
    case 'subscription.resumed':
    case 'subscription.updated':
      if (sub) await syncSubscription(sub);
      return 'processed';
    case 'subscription.halted':
    case 'subscription.cancelled':
    case 'subscription.completed':
    case 'subscription.paused':
      if (sub) await syncSubscription(sub, true);
      return 'processed';
    default:
      return 'ignored';
  }
}
