import { test, expect } from '@playwright/test';

test.describe('Phase 4 — full purchase scenario', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation'], { origin: 'http://127.0.0.1:5173' });
    await context.setGeolocation({ latitude: 59.93863, longitude: 30.31413 });
  });

  test('search → results → build route → deeplink menu visible', async ({ page }) => {
    await page.goto('/');

    // Wait for either map ready или error fallback; skip if ymaps3 fails
    const mapReady = await page
      .waitForSelector(
        '[data-testid="results-list"], .map-error-fallback, button[aria-label="Где припарковаться?"]',
        { timeout: 10_000 },
      )
      .catch(() => null);
    if (!mapReady) {
      test.skip(true, 'ymaps3 CDN unavailable в headless Chrome — Phase 3 known blocker');
    }

    await page.getByRole('button', { name: 'Где припарковаться?' }).first().click();

    await expect(
      page.getByText(/Для поиска ближайших парковок нужен доступ к вашей геолокации/),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Разрешить геолокацию' }).click();

    await expect(page).toHaveURL(/from=59\.93863,30\.31413/);

    await expect(
      page.getByTestId('desktop-results-panel').or(page.getByTestId('mobile-results-sheet')),
    ).toBeVisible({ timeout: 10_000 });

    const firstItem = page.locator('[data-testid^="result-item-"]').first();
    await firstItem.click();

    await expect(page).toHaveURL(/sel=\d+/);

    await page.getByTestId('build-route-button').click();

    await expect(page).toHaveURL(/route=\d+/);
    await expect(page.getByTestId('route-summary-card')).toBeVisible();

    await page.getByTestId('in-put-button').click();
    await expect(page.getByText('Яндекс Навигатор')).toBeVisible();
    await expect(page.getByText('Яндекс Карты (web)')).toBeVisible();
    await expect(page.getByText('Google Maps')).toBeVisible();
  });

  test('reload с invalid ?route не crashит page', async ({ page }) => {
    await page.goto('/?route=999999');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByTestId('route-summary-card')).toHaveCount(0);
  });

  test('?dest в URL при reload — page renders ok', async ({ page }) => {
    await page.goto('/?dest=59.95598,30.30943');
    await expect(page).toHaveURL(/dest=59\.95598,30\.30943/);
    await expect(page.locator('body')).toBeVisible();
  });
});
