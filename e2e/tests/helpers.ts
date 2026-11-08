import { expect, type Page, type APIRequestContext } from '@playwright/test';

export const API_URL = process.env.API_URL ?? 'http://localhost:4001';
export const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:8100';

let counter = 0;

/**
 * Navigate and wait until React has hydrated. Typing into a controlled input
 * before hydration gets wiped when React takes over (seen on cold dev-server
 * compiles). The App Router mounts <next-route-announcer> once hydrated.
 */
export async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.locator('next-route-announcer').waitFor({ state: 'attached', timeout: 60_000 });
}

/** A fresh, unique test learner for every test (never a real person). */
export function newLearner(tag: string) {
  counter += 1;
  // Workers for the desktop and mobile projects run the same test at the same
  // millisecond, so the clock + per-worker counter alone can collide.
  const stamp = `${Date.now()}${counter}${Math.random().toString(36).slice(2, 7)}`;
  return {
    name: `E2E ${tag}`,
    email: `e2e.${tag}.${stamp}@kijitalk.test`,
    password: `Chai-Samosa-${Math.random().toString(36).slice(2, 8)}!`,
  };
}

/** Signs up as an adult through the real UI and finishes onboarding. */
export async function signUpAdult(page: Page, learner: ReturnType<typeof newLearner>) {
  await gotoReady(page, '/signup');
  await page.getByLabel('Naam').fill(learner.name);
  await page.getByLabel('Email').fill(learner.email);
  await page.getByLabel('Password', { exact: true }).fill(learner.password);
  await page.getByRole('button', { name: '18 ya usse zyada' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/onboarding\/profile/);
  await page.getByRole('button', { name: 'Class 9' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('State').selectOption('Goa');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Shuru karo!' }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(`Namaste, ${learner.name.split(' ')[0]}`)).toBeVisible();
}

/** An access token for API-level steps, via the same login the apps use. */
export async function accessToken(request: APIRequestContext, learner: { email: string; password: string }) {
  const res = await request.post(`${AUTH_URL}/api/auth/login/`, {
    data: { email: learner.email, password: learner.password },
    headers: { 'X-KT-Client': 'mobile' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).access as string;
}
