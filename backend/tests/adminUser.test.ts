import type { User } from '@prisma/client';
import { extendGrant, refundablePaise } from '../src/services/adminUser.service';
import { effectiveTier } from '../src/services/subscription.service';

const DAY = 24 * 60 * 60 * 1000;

describe('extendGrant (complimentary Premium)', () => {
  const now = new Date('2026-11-09T10:00:00Z');

  it('starts from now when there is no grant or it has lapsed', () => {
    expect(extendGrant(null, 30, now).getTime()).toBe(now.getTime() + 30 * DAY);
    expect(extendGrant(new Date(now.getTime() - DAY), 7, now).getTime()).toBe(now.getTime() + 7 * DAY);
  });

  it('adds on top of a grant that is still running', () => {
    const current = new Date(now.getTime() + 10 * DAY);
    expect(extendGrant(current, 5, now).getTime()).toBe(current.getTime() + 5 * DAY);
  });
});

describe('refundablePaise', () => {
  it('is the unrefunded part of a paid payment', () => {
    expect(refundablePaise({ amountInr: 149, refundedPaise: 0, status: 'paid' })).toBe(14900);
    expect(refundablePaise({ amountInr: 149, refundedPaise: 4900, status: 'paid' })).toBe(10000);
    expect(refundablePaise({ amountInr: 149, refundedPaise: 14900, status: 'refunded' })).toBe(0);
  });

  it('is zero for payments that never went through', () => {
    expect(refundablePaise({ amountInr: 149, refundedPaise: 0, status: 'created' })).toBe(0);
    expect(refundablePaise({ amountInr: 149, refundedPaise: 0, status: 'failed' })).toBe(0);
  });
});

describe('effectiveTier with an admin grant', () => {
  const base = {
    subscriptionTier: 'free',
    subscriptionExpiresAt: null,
    schoolLicenseUntil: null,
    premiumGrantUntil: null,
  } as unknown as User;

  it('gives Premium while the grant runs, and not after', () => {
    expect(effectiveTier({ ...base, premiumGrantUntil: new Date(Date.now() + DAY) })).toBe('premium');
    expect(effectiveTier({ ...base, premiumGrantUntil: new Date(Date.now() - DAY) })).toBe('free');
    expect(effectiveTier(base)).toBe('free');
  });
});
