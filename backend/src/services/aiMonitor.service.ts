import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export type AiProvider = 'gemini' | 'claude' | 'offline';
export type AiFeature = 'chat' | 'roleplay' | 'debate' | 'voice';

interface ProviderHealth {
  configured: boolean;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  /** While set, the provider is skipped (circuit breaker) so users don't wait on it. */
  pausedUntil: string | null;
}

// After this many failures in a row a provider is paused, then retried.
const FAILURES_BEFORE_PAUSE = 3;
const PAUSE_MS = 2 * 60 * 1000;
// A rejected key won't fix itself — pause longer and say so in the health check.
const AUTH_ERROR_PAUSE_MS = 10 * 60 * 1000;

const health: Record<'gemini' | 'claude', ProviderHealth> = {
  gemini: { configured: false, consecutiveFailures: 0, lastSuccessAt: null, lastErrorAt: null, lastError: null, pausedUntil: null },
  claude: { configured: false, consecutiveFailures: 0, lastSuccessAt: null, lastErrorAt: null, lastError: null, pausedUntil: null },
};

export function setProviderConfigured(provider: 'gemini' | 'claude', configured: boolean): void {
  health[provider].configured = configured;
}

/** Short, secret-free description of an AI error for logs and the admin view. */
export function describeAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/API_KEY_INVALID|API key not valid|invalid x-api-key|authentication_error|401/i.test(raw)) {
    return 'Invalid or missing API key';
  }
  if (/quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(raw)) return 'Rate limit or quota exceeded';
  if (/timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed/i.test(raw)) return 'Network error or timeout';
  return raw.replace(/key=[^&\s]+/gi, 'key=***').slice(0, 200);
}

export function isProviderPaused(provider: 'gemini' | 'claude'): boolean {
  const until = health[provider].pausedUntil;
  return until !== null && new Date(until).getTime() > Date.now();
}

export function getAiHealth() {
  return {
    gemini: { ...health.gemini, paused: isProviderPaused('gemini') },
    claude: { ...health.claude, paused: isProviderPaused('claude') },
  };
}

interface AiCall {
  provider: AiProvider;
  feature: AiFeature;
  ok: boolean;
  latencyMs: number;
  fallback?: boolean;
  userId?: string | null;
  error?: unknown;
}

/** Records one AI call: updates provider health and writes a usage row (never throws). */
export function recordAiCall(call: AiCall): void {
  const errorText = call.error === undefined ? null : describeAiError(call.error);

  if (call.provider !== 'offline') {
    const h = health[call.provider];
    if (call.ok) {
      h.consecutiveFailures = 0;
      h.lastSuccessAt = new Date().toISOString();
      h.pausedUntil = null;
    } else {
      h.consecutiveFailures += 1;
      h.lastErrorAt = new Date().toISOString();
      h.lastError = errorText;
      const authProblem = errorText === 'Invalid or missing API key';
      if (authProblem || h.consecutiveFailures >= FAILURES_BEFORE_PAUSE) {
        h.pausedUntil = new Date(Date.now() + (authProblem ? AUTH_ERROR_PAUSE_MS : PAUSE_MS)).toISOString();
        logger.error(`AI provider ${call.provider} paused: ${errorText}`);
      }
    }
  }

  void prisma.aiUsageLog
    .create({
      data: {
        provider: call.provider,
        feature: call.feature,
        ok: call.ok,
        fallback: call.fallback ?? false,
        latencyMs: Math.max(0, Math.round(call.latencyMs)),
        userId: call.userId ?? null,
        error: errorText,
      },
    })
    .catch((error) => logger.warn('Could not write AI usage log', error));
}

/** Aggregated usage for the admin dashboard. */
export async function getAiUsageStats(hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [byProvider, byFeature, recentErrors, activeUsers] = await Promise.all([
    prisma.aiUsageLog.groupBy({
      by: ['provider', 'ok'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { latencyMs: true },
    }),
    prisma.aiUsageLog.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.aiUsageLog.groupBy({
      by: ['provider', 'error'],
      where: { createdAt: { gte: since }, ok: false },
      _count: { _all: true },
      orderBy: { _count: { provider: 'desc' } },
      take: 10,
    }),
    prisma.aiUsageLog.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);
  const fallbacks = await prisma.aiUsageLog.count({ where: { createdAt: { gte: since }, fallback: true, ok: true } });

  const providers: Record<string, { ok: number; failed: number; avgLatencyMs: number | null }> = {};
  for (const row of byProvider) {
    const p = (providers[row.provider] ??= { ok: 0, failed: 0, avgLatencyMs: null });
    if (row.ok) {
      p.ok = row._count._all;
      p.avgLatencyMs = row._avg.latencyMs === null ? null : Math.round(row._avg.latencyMs);
    } else {
      p.failed = row._count._all;
    }
  }

  return {
    windowHours: hours,
    providers,
    byFeature: Object.fromEntries(byFeature.map((r) => [r.feature, r._count._all])),
    fallbackReplies: fallbacks,
    activeUsers: activeUsers.length,
    topErrors: recentErrors.map((r) => ({ provider: r.provider, error: r.error, count: r._count._all })),
  };
}

/** Startup self-test result: updates health without writing a usage row. */
export function markProviderCheck(provider: 'gemini' | 'claude', ok: boolean, error?: unknown): void {
  const h = health[provider];
  if (ok) {
    h.lastSuccessAt = new Date().toISOString();
    h.consecutiveFailures = 0;
    h.pausedUntil = null;
    return;
  }
  h.lastErrorAt = new Date().toISOString();
  h.lastError = describeAiError(error);
  if (h.lastError === 'Invalid or missing API key') {
    h.pausedUntil = new Date(Date.now() + AUTH_ERROR_PAUSE_MS).toISOString();
  }
}
