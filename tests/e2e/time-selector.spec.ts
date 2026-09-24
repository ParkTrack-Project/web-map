import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });
test.setTimeout(60_000);

const returnToNowButtonName = /Вернуться к Сейчас|Return to Now/i;
const hourAgoButtonName = /Час назад|An hour ago/i;
const inAnHourButtonName = /Через час|In an hour/i;

function timeParam(page: Page): string | null {
  return new URL(page.url()).searchParams.get('t');
}

async function openTimeSelector(page: Page) {
  try {
    await page.waitForSelector('#root > *', { state: 'attached', timeout: 30_000 });
  } catch (error) {
    const title = await page.title().catch(() => '<title unavailable>');
    const rootHtml = await page
      .locator('#root')
      .evaluate((root) => root.innerHTML.slice(0, 2000))
      .catch(() => '<root unavailable>');
    const pageContent = await page
      .content()
      .then((content) => content.slice(0, 2000))
      .catch(() => '<page content unavailable>');
    throw new Error(
      [
        'Application did not render inside #root.',
        `url=${page.url()}`,
        `title=${title}`,
        `rootHtml=${rootHtml}`,
        `pageContentStart=${pageContent}`,
        error instanceof Error ? error.message : String(error),
      ].join('\n'),
    );
  }

  const timeButton = page
    .getByTestId('time-selector-trigger')
    .or(page.getByRole('button', { name: /Время|Time|Сейчас|Now/i }))
    .first();

  try {
    await expect(timeButton).toBeVisible({ timeout: 30_000 });
  } catch (error) {
    const title = await page.title().catch(() => '<title unavailable>');
    const rootHtml = await page
      .locator('#root')
      .evaluate((root) => root.innerHTML.slice(0, 2000))
      .catch(() => '<root unavailable>');
    throw new Error(
      [
        'Time selector trigger did not render.',
        `url=${page.url()}`,
        `title=${title}`,
        `rootHtml=${rootHtml}`,
        error instanceof Error ? error.message : String(error),
      ].join('\n'),
    );
  }

  await timeButton.click();
  await expect(page.getByTestId('time-selector-content')).toBeVisible({ timeout: 20_000 });
}

test.describe('Phase 3 — TimeSelector URL serialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await openTimeSelector(page);
  });

  test('Прошлое → URL содержит ISO в прошлом', async ({ page }) => {
    await page.getByRole('button', { name: hourAgoButtonName }).click();
    await expect.poll(() => timeParam(page)).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
    expect(Date.parse(timeParam(page)!)).toBeLessThan(Date.now());
  });

  test('Будущее → URL содержит ISO в будущем', async ({ page }) => {
    await page.getByRole('button', { name: inAnHourButtonName }).click();
    await expect.poll(() => timeParam(page)).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
    expect(Date.parse(timeParam(page)!)).toBeGreaterThan(Date.now());
  });

  test('Сейчас (default) → URL не содержит ?t= (clearOnDefault)', async ({ page }) => {
    await page.getByRole('button', { name: hourAgoButtonName }).click();
    await expect.poll(() => timeParam(page)).not.toBeNull();
    await page.getByRole('button', { name: returnToNowButtonName }).click();
    await expect.poll(() => timeParam(page)).toBeNull();
  });

  test('Reset CTA «Вернуться к Сейчас» очищает URL', async ({ page }) => {
    await page.getByRole('button', { name: inAnHourButtonName }).click();
    await expect.poll(() => timeParam(page)).not.toBeNull();
    await page.getByRole('button', { name: returnToNowButtonName }).first().click();
    await expect.poll(() => timeParam(page)).toBeNull();
  });

  test('Preset «Час назад» → URL обновлён', async ({ page }) => {
    const before = page.url();
    await page.getByRole('button', { name: hourAgoButtonName }).click();
    // URL должен поменяться (новый ISO timestamp)
    await expect.poll(() => page.url(), { timeout: 2000 }).not.toBe(before);
    await expect.poll(() => timeParam(page)).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z$/);
  });

  test('Deeplink ?t=past:ISO → прошлый режим восстановлен при загрузке', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?t=past:2026-04-22T09:00:00.000Z');
    await openTimeSelector(page);
    await expect(page.getByRole('button', { name: returnToNowButtonName })).toBeVisible({
      timeout: 10_000,
    });
    expect(timeParam(page)).toBe('past:2026-04-22T09:00:00.000Z');
  });
});
