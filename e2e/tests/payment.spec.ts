import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import { API_URL, accessToken, newLearner, signUpAdult, gotoReady } from './helpers';

// Same value as the API's RAZORPAY_WEBHOOK_SECRET (a test value, never the live one).
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

test('pricing page shows both plans', async ({ page }) => {
  await signUpAdult(page, newLearner('pricing'));
  await gotoReady(page, '/pricing');
  await expect(page.getByText('₹149/month')).toBeVisible();
  await expect(page.getByText('Free', { exact: true }).first()).toBeVisible();
});

test('a Razorpay subscription charge unlocks Premium and issues a GST invoice', async ({ page, request }) => {
  test.skip(!WEBHOOK_SECRET, 'set RAZORPAY_WEBHOOK_SECRET to the API test value');
  const learner = newLearner('payment');
  await signUpAdult(page, learner);

  const token = await accessToken(request, learner);
  const me = await (await request.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).json();

  const now = Math.floor(Date.now() / 1000);
  const sub = { id: `sub_e2e_${now}`, status: 'active', plan_id: 'plan_e2e', current_start: now, current_end: now + 30 * 86400, notes: { userId: me.user.id } };
  const body = JSON.stringify({
    event: 'subscription.charged',
    payload: { subscription: { entity: sub }, payment: { entity: { id: `pay_e2e_${now}`, amount: 14900, status: 'captured' } } },
  });
  const send = (sig: string, eventId: string) =>
    request.post(`${API_URL}/api/subscription/webhook`, {
      data: body,
      headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': sig, 'X-Razorpay-Event-Id': eventId },
    });

  expect((await send('forged', `evt_bad_${now}`)).status()).toBe(400);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET!).update(body).digest('hex');
  expect((await send(signature, `evt_e2e_${now}`)).ok()).toBeTruthy();
  expect(await (await send(signature, `evt_e2e_${now}`)).json()).toMatchObject({ outcome: 'duplicate' });

  await gotoReady(page, '/pricing');
  await expect(page.getByText('Aap Premium ho!')).toBeVisible();
  await page.getByRole('link', { name: /KT\/\d{4}-\d{2}\/\d{6}/ }).click();
  await expect(page.getByText('TAX INVOICE')).toBeVisible();
  await expect(page.getByText('Goa (30)')).toBeVisible();
  await expect(page.getByText('₹149.00')).toBeVisible();
});
