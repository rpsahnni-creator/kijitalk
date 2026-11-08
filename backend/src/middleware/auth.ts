import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { verifyAccessToken } from '../utils/authToken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    /** Learner profile id (Prisma users.id). */
    uid: string;
    email: string;
    emailVerified: boolean;
    gate: string;
  };
}

// Login accounts live in auth-service; learner profiles live here and are
// matched by email. Cache the lookup so every request doesn't hit the table.
// Entries expire after a minute so a suspension made on another API instance
// takes effect quickly everywhere.
const PROFILE_CACHE_LIMIT = 5000;
const PROFILE_CACHE_TTL_MS = 60_000;
interface CachedProfile {
  id: string;
  suspended: boolean;
  at: number;
}
const profileByEmail = new Map<string, CachedProfile>();

/** Forget a cached profile, e.g. after the account is deleted or suspended. */
export function evictProfile(email: string): void {
  profileByEmail.delete(email.toLowerCase());
}

export const SUSPENDED_MESSAGE = 'Aapka account suspend kar diya gaya hai. Madad ke liye support se baat karo.';

// Until a learner has accepted the Terms and (if under 18) a parent has
// consented, only these routes work: reading the profile (to show the gate),
// and downloading their data. No new personal data (class, board, state…) is
// collected before consent — DPDP Act s.9. Deletion runs via auth-service.
const GATE_READ_ONLY = ['/api/auth/me', '/api/account'];

export function gateBlocks(gate: string, url: string, method = 'GET'): boolean {
  if (gate === 'ok') return false;
  if (method !== 'GET' && method !== 'HEAD') return true;
  const path = url.split('?')[0];
  return !GATE_READ_ONLY.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

const GATE_MESSAGES: Record<string, string> = {
  setup: 'Pehle Terms accept karo aur apni umar batao.',
  parent_pending: 'Aapke parent ki permission ka intezaar hai.',
  parent_denied: 'Parent ne permission nahi di, isliye yeh feature band hai.',
};

async function resolveProfile(email: string, name: string): Promise<CachedProfile> {
  const cached = profileByEmail.get(email);
  if (cached && Date.now() - cached.at < PROFILE_CACHE_TTL_MS) return cached;

  // First request from a new account creates its learner profile.
  const profile = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: name },
    select: { id: true, suspendedAt: true },
  });

  if (profileByEmail.size >= PROFILE_CACHE_LIMIT) {
    const oldest = profileByEmail.keys().next().value;
    if (oldest) profileByEmail.delete(oldest);
  }
  const entry = { id: profile.id, suspended: profile.suspendedAt !== null, at: Date.now() };
  profileByEmail.set(email, entry);
  return entry;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const claims = verifyAccessToken(authHeader.slice('Bearer '.length));
  if (!claims) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (gateBlocks(claims.gate, req.originalUrl, req.method)) {
    res.status(403).json({
      error: GATE_MESSAGES[claims.gate] ?? 'Account abhi active nahi hai.',
      gate: claims.gate,
    });
    return;
  }

  try {
    const profile = await resolveProfile(claims.email, claims.name);
    if (profile.suspended) {
      res.status(403).json({ error: SUSPENDED_MESSAGE, suspended: true });
      return;
    }
    req.user = { uid: profile.id, email: claims.email, emailVerified: claims.emailVerified, gate: claims.gate };
    next();
  } catch (error) {
    logger.error('authMiddleware: could not load learner profile', error);
    res.status(500).json({ error: 'Could not load your profile' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  const claims = verifyAccessToken(authHeader.slice('Bearer '.length));
  if (!claims || claims.gate !== 'ok') {
    // A stale or not-yet-active token on a public route is treated as anonymous.
    next();
    return;
  }
  resolveProfile(claims.email, claims.name)
    .then((profile) => {
      // A suspended learner browses public routes as anonymous.
      if (!profile.suspended) {
        req.user = { uid: profile.id, email: claims.email, emailVerified: claims.emailVerified, gate: claims.gate };
      }
      next();
    })
    .catch((error) => {
      logger.warn('optionalAuth: profile lookup failed, continuing unauthenticated', error);
      next();
    });
}
