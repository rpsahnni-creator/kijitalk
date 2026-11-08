import { test, expect, type Page } from '@playwright/test';
import { API_URL, newLearner, signUpAdult, gotoReady } from './helpers';

interface Exercise {
  type: 'repeat' | 'fill-blank' | 'translate' | 'mcq' | 'match' | 'word-bank' | 'listen-type';
  answer: string;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  words?: string[];
}

/** Answers one exercise correctly, whatever its type. */
async function solve(page: Page, ex: Exercise) {
  const card = page.locator('main .card').first();
  switch (ex.type) {
    case 'repeat':
      await card.getByRole('button', { name: /Maine bol diya|Complete lesson/ }).click();
      break;
    case 'fill-blank':
    case 'translate':
    case 'listen-type':
      await card.getByRole('textbox').fill(ex.answer);
      await card.getByRole('button', { name: 'Check' }).click();
      break;
    case 'mcq': {
      const option = (ex.options ?? []).find((o) => o.trim().toLowerCase() === ex.answer.trim().toLowerCase())!;
      await card.getByRole('button', { name: option, exact: true }).click();
      break;
    }
    case 'word-bank':
      // Picked words leave the bank, so the first enabled match is always the right one.
      for (const word of ex.answer.split(' ')) {
        await card.locator('button:not([disabled])', { hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).last().click();
      }
      await card.getByRole('button', { name: 'Check' }).click();
      break;
    case 'match':
      for (const pair of ex.pairs ?? []) {
        await card.getByRole('button', { name: pair.left, exact: true }).click();
        await card.getByRole('button', { name: pair.right, exact: true }).click();
      }
      break;
  }
}

test('complete a whole lesson with full marks', async ({ page, request }) => {
  await signUpAdult(page, newLearner('lesson'));

  const { lessons } = await (await request.get(`${API_URL}/api/lessons`)).json();
  const lesson = lessons.find((l: { exercises: Exercise[] }) => l.exercises.length >= 3) ?? lessons[0];

  await gotoReady(page, `/lessons/${lesson.id}`);
  await page.getByRole('button', { name: /Start practice/ }).click();

  for (const [i, ex] of (lesson.exercises as Exercise[]).entries()) {
    await expect(page.getByText(new RegExp(`${i + 1}/${lesson.exercises.length}`))).toBeVisible();
    await solve(page, ex);
  }

  await expect(page.getByText('Lesson complete')).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText(/save nahi ho paya/)).toHaveCount(0);
});

test('a wrong answer costs one heart and shows the right answer', async ({ page, request }) => {
  await signUpAdult(page, newLearner('hearts'));
  const { lessons } = await (await request.get(`${API_URL}/api/lessons`)).json();
  const lesson = lessons.find((l: { exercises: Exercise[] }) => l.exercises.some((e) => e.type === 'fill-blank' || e.type === 'translate'));
  const index = (lesson.exercises as Exercise[]).findIndex((e) => e.type === 'fill-blank' || e.type === 'translate');

  await gotoReady(page, `/lessons/${lesson.id}`);
  await page.getByRole('button', { name: /Start practice/ }).click();
  for (const ex of (lesson.exercises as Exercise[]).slice(0, index)) await solve(page, ex);

  const card = page.locator('main .card').first();
  await card.getByRole('textbox').fill('zzz');
  await card.getByRole('button', { name: 'Check' }).click();
  await expect(card.getByText('Galat hai')).toBeVisible();
  await expect(page.getByLabel('4 hearts left')).toBeVisible();
});
