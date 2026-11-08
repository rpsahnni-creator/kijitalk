import type { AddressInfo } from 'net';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

// Small limits so the test is quick; the limiter reads them when the app is built.
env.RATE_LIMIT_PER_USER = 3;
env.RATE_LIMIT_PER_IP = 5;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createApp } = require('../src/app') as typeof import('../src/app');

const tokenFor = (userId: number) =>
  jwt.sign(
    { token_type: 'access', user_id: userId, email: `s${userId}@school.test`, name: 'S', email_verified: true },
    env.AUTH_JWT_SECRET,
    { algorithm: 'HS256', issuer: env.AUTH_JWT_ISSUER, audience: env.AUTH_JWT_AUDIENCE, expiresIn: '15m' }
  );

describe('rate limiting', () => {
  let server: Server;
  let base: string;

  beforeAll((done) => {
    server = createApp().listen(0, () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      done();
    });
  });
  afterAll((done) => {
    server.close(() => done());
  });

  const hit = (token?: string) =>
    fetch(`${base}/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.status);

  it('limits each signed-in learner separately, even on one shared IP', async () => {
    const a = tokenFor(101);
    const b = tokenFor(102);
    expect([await hit(a), await hit(a), await hit(a)]).toEqual([200, 200, 200]);
    expect(await hit(a)).toBe(429);
    // A classmate on the same school Wi-Fi is not affected.
    expect(await hit(b)).toBe(200);
  });

  it('limits anonymous traffic per IP', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) statuses.push(await hit());
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });

  it('never limits the Razorpay webhook', async () => {
    const res = await fetch(`${base}/api/subscription/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).not.toBe(429);
  });
});
