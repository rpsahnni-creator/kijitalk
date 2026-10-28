import type { User } from '@prisma/client';
import { getPlan } from '../config/plans';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Mutates the user in place if a new day has started; caller persists via saveUser. */
export function resetUsageIfNeeded(user: User): void {
  if (startOfDay(new Date()).getTime() !== startOfDay(user.aiUsageResetAt).getTime()) {
    user.aiMessagesToday = 0;
    user.aiUsageResetAt = new Date();
  }
}

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * The tier to actually gate behavior on. A paid premium period lapses once
 * subscriptionExpiresAt passes; nothing cron-based flips subscriptionTier back
 * to 'free' in the database, so every usage check re-derives it here instead.
 */
export function effectiveTier(user: User): 'free' | 'premium' {
  if (user.subscriptionTier === 'premium' && user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
    return 'free';
  }
  return user.subscriptionTier;
}

export function checkAiUsage(user: User): UsageStatus {
  resetUsageIfNeeded(user);
  const plan = getPlan(effectiveTier(user));
  if (plan.dailyAiActions === Infinity) {
    return { allowed: true, used: user.aiMessagesToday, limit: Infinity, remaining: Infinity };
  }
  const remaining = Math.max(0, plan.dailyAiActions - user.aiMessagesToday);
  return { allowed: remaining > 0, used: user.aiMessagesToday, limit: plan.dailyAiActions, remaining };
}

/** Mutates the user in place; caller persists via saveUser. */
export function recordAiUsage(user: User): void {
  user.aiMessagesToday += 1;
}

export function canUseClaudeEngine(user: User): boolean {
  return getPlan(effectiveTier(user)).claudeAccess;
}
