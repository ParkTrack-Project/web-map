// Phase 4 E2E smoke — full purchase scenario с stubs.
// ROUTE-08: code-level Phase 4; real-device matrix (iPhone iOS17+, Android 14+, VK/TG)
// deferred to Phase 5 per CONTEXT D-36 + research metadata.
//
// ymaps3 CDN может fail в headless Chrome (Phase 3 blocker per STATE.md).
// В таком случае test.skip с reason — spec остаётся как code asset.
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

    // 1. Click [Где припарковаться?]
    await page.getByRole('button', { name: 'Где припарковаться?' }).first().click();

    // 2. Pre-flight modal/drawer visible с EXACT текстом
    await expect(
      page.getByText(/Для поиска ближайших парковок нужен доступ к вашей геолокации/),
    ).toBeVisible();

    // 3. Click [Разрешить геолокацию]
    await page.getByRole('button', { name: 'Разрешить геолокацию' }).click();

    // 4. ?from в URL
    await expect(page).toHaveURL(/from=59\.93863,30\.31413/);

    // 5. ResultsPanel visible (desktop or mobile)
    await expect(
      page.getByTestId('desktop-results-panel').or(page.getByTestId('mobile-results-sheet')),
    ).toBeVisible({ timeout: 10_000 });

    // 6. Click first result item
    const firstItem = page.locator('[data-testid^="result-item-"]').first();
    await firstItem.click();

    // 7. ?sel в URL
    await expect(page).toHaveURL(/sel=\d+/);

    // 8. Click [Построить маршрут]
    await page.getByTestId('build-route-button').click();

    // 9. ?route в URL → RouteSummaryCard visible
    await expect(page).toHaveURL(/route=\d+/);
    await expect(page.getByTestId('route-summary-card')).toBeVisible();

    // 10. Click [В путь →] → deeplink menu visible с 3 опциями
    await page.getByTestId('in-put-button').click();
    await expect(page.getByText('Яндекс Навигатор')).toBeVisible();
    await expect(page.getByText('Яндекс Карты (web)')).toBeVisible();
    await expect(page.getByText('Google Maps')).toBeVisible();
  });

  test('reload с invalid ?route не crashит page', async ({ page }) => {
    // MSW ROUTES Map очищается на reload (research §Runtime State Inventory)
    // → 404 → RouteSummaryCard не рендерится; no crash
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
