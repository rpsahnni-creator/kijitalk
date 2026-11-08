import { test, expect } from '@playwright/test';
import { newLearner, signUpAdult, gotoReady } from './helpers';

test('sign up, sign out and sign back in', async ({ page }) => {
  const learner = newLearner('auth');
  await signUpAdult(page, learner);

  // Session survives a reload (refresh token in an httpOnly cookie).
  await page.reload();
  await expect(page.getByText(`Namaste, ${learner.name.split(' ')[0]}`)).toBeVisible();
  expect(await page.evaluate(() => document.cookie)).not.toContain('kt_refresh');

  await gotoReady(page, '/settings');
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/$|\/login/);
  await gotoReady(page, '/dashboard');
  await expect(page).toHaveURL(/login/);

  await page.getByLabel('Email').fill(learner.email);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/password galat|Invalid email/i)).toBeVisible();

  await page.getByLabel('Password', { exact: true }).fill(learner.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test('forgot password never reveals whether an account exists', async ({ page }) => {
  await gotoReady(page, '/forgot-password');
  await page.getByLabel('Email').fill(`nobody.${Date.now()}@kijitalk.test`);
  await page.getByRole('button', { name: 'Reset link bhejo' }).click();
  await expect(page.getByText('Inbox check karo')).toBeVisible();
});

test('under-18 sign-up waits for parent consent', async ({ page }) => {
  const learner = newLearner('minor');
  await gotoReady(page, '/signup');
  await page.getByLabel('Naam').fill(learner.name);
  await page.getByLabel('Email').fill(learner.email);
  await page.getByLabel('Password', { exact: true }).fill(learner.password);
  await page.getByRole('button', { name: '18 se kam' }).click();
  await page.getByLabel('Parent / guardian ka email').fill(`parent.${Date.now()}@kijitalk.test`);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding\/profile/);
  // No profile questions before the parent consents — the gate comes first.
  await expect(page.getByText('Parent ki permission ka intezaar')).toBeVisible();
  await expect(page.getByText('Kaunsi class mein ho?')).toHaveCount(0);
  await gotoReady(page, '/dashboard');
  await expect(page.getByText('Parent ki permission ka intezaar')).toBeVisible();
});
