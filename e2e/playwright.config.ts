import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running stack:
 *   web  http://localhost:3100   (frontend)
 *   api  http://localhost:4001   (backend)
 *   auth http://localhost:8100   (auth-service)
 * Start all three first (see README "E2E tests"), then: npm test
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /auth\.spec\.ts/ },
  ],
});
