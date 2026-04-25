import { test, expect } from '@playwright/test';

// Plan 02 рендерит только placeholder MapPage; Plan 03 заменит на реальную карту.
// Пока проверяем, что страница грузится без runtime-ошибок.
test('app boots', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
});
