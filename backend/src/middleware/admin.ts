import { Response, NextFunction } from 'express';
import { env } from '../config/env';
import type { AuthRequest } from './auth';

/** Comma-separated ADMIN_EMAILS from the environment, normalised. */
export function adminEmails(): string[] {
  return env.ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** Use after authMiddleware. Only emails listed in ADMIN_EMAILS get through. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!isAdmin(req.user?.email)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
