import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

async function openTimeSelector(page: Page) {
  const timeButton = page.getByTestId('time-selector-trigger');
  await expect(timeButton).toBeVisible({ timeout: 20_000 });
  await timeButton.click();
  await expect(page.getByTestId('time-selector-content')).toBeVisible({ timeout: 20_000 });
}

test.describe('Phase 3 — TimeSelector URL serialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await openTimeSelector(page);
  });

  test('Прошлое → URL содержит ?t=past:ISO', async ({ page }) => {
    await page.getByRole('button', { name: 'Прошлое' }).click();
    await expect(page).toHaveURL(/[?&]t=past%3A/);
  });

  test('Будущее → URL содержит ?t=future:ISO', async ({ page }) => {
    await page.getByRole('button', { name: 'Будущее' }).click();
    await expect(page).toHaveURL(/[?&]t=future%3A/);
  });

  test('Сейчас (default) → URL не содержит ?t= (clearOnDefault)', async ({ page }) => {
    await page.getByRole('button', { name: 'Прошлое' }).click();
    await expect(page).toHaveURL(/[?&]t=past/);
    await page.getByRole('button', { name: 'Сейчас' }).click();
    await expect(page).not.toHaveURL(/[?&]t=/);
  });

  test('Reset CTA «Вернуться к Сейчас» очищает URL', async ({ page }) => {
    await page.getByRole('button', { name: 'Прошлое' }).click();
    await expect(page).toHaveURL(/[?&]t=past/);
    await page
      .getByRole('button', { name: /Вернуться к Сейчас/ })
      .first()
      .click();
    await expect(page).not.toHaveURL(/[?&]t=/);
  });

  test('Preset «Час назад» → URL обновлён', async ({ page }) => {
    await page.getByRole('button', { name: 'Прошлое' }).click();
    await expect(page).toHaveURL(/[?&]t=past%3A/);
    const before = page.url();
    await page.getByRole('button', { name: 'Час назад' }).click();
    // URL должен поменяться (новый ISO timestamp)
    await expect.poll(() => page.url(), { timeout: 2000 }).not.toBe(before);
    await expect(page).toHaveURL(/[?&]t=past%3A/);
  });

  test('Deeplink ?t=past:ISO → segment «Прошлое» pressed при загрузке', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?t=past:2026-04-22T09:00:00.000Z');
    await openTimeSelector(page);
    await expect(page.getByRole('button', { name: 'Прошлое' })).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 10_000 },
    );
  });
});
