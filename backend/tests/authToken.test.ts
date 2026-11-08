import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { verifyAccessToken } from '../src/utils/authToken';

function sign(claims: Record<string, unknown>, options: jwt.SignOptions = {}) {
  return jwt.sign(
    { token_type: 'access', user_id: 7, email: 'Asha@Example.com', name: 'Asha', email_verified: true, ...claims },
    env.AUTH_JWT_SECRET,
    { algorithm: 'HS256', issuer: env.AUTH_JWT_ISSUER, audience: env.AUTH_JWT_AUDIENCE, expiresIn: '15m', ...options }
  );
}

describe('verifyAccessToken (tokens from auth-service)', () => {
  it('accepts a valid access token and normalises the email', () => {
    expect(verifyAccessToken(sign({}))).toEqual({
      authUserId: '7',
      email: 'asha@example.com',
      name: 'Asha',
      emailVerified: true,
      gate: 'ok',
    });
  });

  it('rejects refresh tokens', () => {
    expect(verifyAccessToken(sign({ token_type: 'refresh' }))).toBeNull();
  });

  it('rejects the wrong audience, issuer or secret', () => {
    expect(verifyAccessToken(sign({}, { audience: 'someone-else' }))).toBeNull();
    expect(verifyAccessToken(sign({}, { issuer: 'someone-else' }))).toBeNull();
    const forged = jwt.sign({ token_type: 'access', email: 'a@b.c' }, 'x'.repeat(40), {
      issuer: env.AUTH_JWT_ISSUER,
      audience: env.AUTH_JWT_AUDIENCE,
    });
    expect(verifyAccessToken(forged)).toBeNull();
  });

  it('rejects expired tokens and tokens without an email', () => {
    expect(verifyAccessToken(sign({}, { expiresIn: -10 }))).toBeNull();
    expect(verifyAccessToken(sign({ email: '' }))).toBeNull();
  });
});
