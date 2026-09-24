import { expect, test } from '@playwright/test';

test('unknown paths show the not-found page and a way back to the map', async ({ page }) => {
  await page.goto('/missing-page');

  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Вернуться к карте' })).toHaveAttribute('href', '/map');
});
