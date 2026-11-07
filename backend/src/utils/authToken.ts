import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** Claims inside an access token issued by auth-service (Django + SimpleJWT). */
export interface AccessTokenClaims {
  authUserId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

/**
 * Verifies a short-lived access token from auth-service: signature, expiry,
 * issuer and audience. Refresh tokens are rejected — they only work at the auth
 * service itself.
 */
export function verifyAccessToken(token: string): AccessTokenClaims | null {
  try {
    const decoded = jwt.verify(token, env.AUTH_JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.AUTH_JWT_ISSUER,
      audience: env.AUTH_JWT_AUDIENCE,
    });
    if (typeof decoded !== 'object' || decoded === null) return null;

    const claims = decoded as Record<string, unknown>;
    if (claims.token_type !== 'access') return null;
    if (typeof claims.email !== 'string' || !claims.email) return null;

    return {
      authUserId: String(claims.user_id ?? ''),
      email: claims.email.toLowerCase(),
      name: typeof claims.name === 'string' && claims.name ? claims.name : 'Learner',
      emailVerified: claims.email_verified === true,
    };
  } catch {
    return null;
  }
}
