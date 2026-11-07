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
  };
}

// Login accounts live in auth-service; learner profiles live here and are
// matched by email. Cache the lookup so every request doesn't hit the table.
const PROFILE_CACHE_LIMIT = 5000;
const profileIdByEmail = new Map<string, string>();

async function resolveProfileId(email: string, name: string): Promise<string> {
  const cached = profileIdByEmail.get(email);
  if (cached) return cached;

  // First request from a new account creates its learner profile.
  const profile = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: name },
    select: { id: true },
  });

  if (profileIdByEmail.size >= PROFILE_CACHE_LIMIT) {
    const oldest = profileIdByEmail.keys().next().value;
    if (oldest) profileIdByEmail.delete(oldest);
  }
  profileIdByEmail.set(email, profile.id);
  return profile.id;
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

  try {
    const uid = await resolveProfileId(claims.email, claims.name);
    req.user = { uid, email: claims.email, emailVerified: claims.emailVerified };
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
  if (!claims) {
    // A stale token on a public route shouldn't block the request.
    next();
    return;
  }
  resolveProfileId(claims.email, claims.name)
    .then((uid) => {
      req.user = { uid, email: claims.email, emailVerified: claims.emailVerified };
      next();
    })
    .catch((error) => {
      logger.warn('optionalAuth: profile lookup failed, continuing unauthenticated', error);
      next();
    });
}
