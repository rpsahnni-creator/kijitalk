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

export function checkAiUsage(user: User): UsageStatus {
  resetUsageIfNeeded(user);
  const plan = getPlan(user.subscriptionTier);
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
  return getPlan(user.subscriptionTier).claudeAccess;
}
