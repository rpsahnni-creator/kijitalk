import type { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { cancelRazorpaySubscription, isRazorpayConfigured } from './payment.service';

/** Support actions applied to the login in auth-service. */
export type AuthAdminAction =
  | 'status'
  | 'suspend'
  | 'unsuspend'
  | 'logout_all'
  | 'send_password_reset'
  | 'mark_verified'
  | 'resend_verification'
  | 'resend_parent_consent'
  | 'delete';

export interface AuthAccountStatus {
  exists: boolean;
  active?: boolean;
  emailVerified?: boolean;
  gate?: string;
  isMinor?: boolean;
  parentEmail?: string | null;
  parentalConsent?: string;
  parentalConsentAt?: string | null;
  parentalConsentName?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  hasPassword?: boolean;
  googleLinked?: boolean;
  joinedAt?: string;
  lastLoginAt?: string | null;
  sessionsRevokedAt?: string | null;
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/** Calls auth-service's internal admin endpoint (server-to-server, INTERNAL_API_KEY). */
export async function callAuthAdmin(email: string, action: AuthAdminAction): Promise<AuthAccountStatus & { deleted?: boolean }> {
  if (!env.INTERNAL_API_KEY) throw new AuthServiceError('INTERNAL_API_KEY set nahi hai — auth-service se baat nahi ho sakti.', 503);
  let res: globalThis.Response;
  try {
    res = await fetch(`${env.AUTH_SERVICE_URL}/internal/accounts/admin/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': env.INTERNAL_API_KEY },
      body: JSON.stringify({ email, action }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    logger.error(`auth-service admin call failed (${action})`, error);
    throw new AuthServiceError('Auth service se jawab nahi aaya. Thodi der baad try karo.', 502);
  }
  const body = (await res.json().catch(() => ({}))) as AuthAccountStatus & { error?: string; deleted?: boolean };
  if (!res.ok) throw new AuthServiceError(body.error ?? `auth-service error ${res.status}`, res.status === 404 || res.status === 409 ? res.status : 502);
  return body;
}

/** Who did what to whom, and why. Never throws — an audit failure is logged, not fatal. */
export async function logAdminAction(entry: {
  adminEmail: string;
  action: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  reason?: string | null;
  details?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminEmail: entry.adminEmail.toLowerCase(),
        action: entry.action,
        targetUserId: entry.targetUserId ?? null,
        targetEmail: entry.targetEmail ?? null,
        reason: entry.reason?.trim() || null,
        details: entry.details,
      },
    });
  } catch (error) {
    logger.error(`Could not write admin audit log for ${entry.action}`, error);
  }
}

const LIVE_STATUSES = ['created', 'authenticated', 'active', 'pending'] as const;

/**
 * Stops every renewing subscription of a learner. `immediately` ends Premium
 * now; otherwise it lasts until the paid period ends. Returns how many stopped.
 */
export async function stopRenewals(userId: string, immediately: boolean): Promise<number> {
  const live = await prisma.subscription.findMany({ where: { userId, status: { in: [...LIVE_STATUSES] } } });
  if (live.length === 0) return 0;
  if (!isRazorpayConfigured()) throw new AuthServiceError('Razorpay configure nahi hai, subscription cancel nahi ho sakti.', 503);
  for (const sub of live) {
    await cancelRazorpaySubscription(sub.razorpaySubscriptionId, !immediately);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: immediately
        ? { status: 'cancelled', cancelledAt: new Date(), cancelAtPeriodEnd: false }
        : { cancelAtPeriodEnd: true },
    });
  }
  if (immediately) {
    await prisma.user.update({ where: { id: userId }, data: { subscriptionExpiresAt: new Date() } });
  }
  return live.length;
}

const DAY = 24 * 60 * 60 * 1000;

/** Extends complimentary Premium from whichever is later: now or the current grant. */
export function extendGrant(current: Date | null, days: number, now = new Date()): Date {
  const from = current && current > now ? current : now;
  return new Date(from.getTime() + days * DAY);
}

/** Refundable amount left on a payment, in paise. */
export function refundablePaise(payment: { amountInr: number; refundedPaise: number; status: string }): number {
  if (payment.status !== 'paid' && payment.status !== 'refunded') return 0;
  return Math.max(0, payment.amountInr * 100 - payment.refundedPaise);
}
