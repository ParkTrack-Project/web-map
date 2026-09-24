import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 }, locale: 'ru-RU' });

test.describe('Phase 2 filters — URL serialization (FILTER-12)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /Открыть фильтры/ });
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    await expect(page.getByRole('heading', { name: 'Фильтры парковок' })).toBeVisible();
  });

  test('hideNoFree → ?fNoFree=true в URL (FILTER-01)', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Только свободные' }).check();
    await expect(page).toHaveURL(/fNoFree=true/);
  });

  test('hidePrivate → ?fNoPriv=true в URL (FILTER-04)', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Скрыть частные' }).check();
    await expect(page).toHaveURL(/fNoPriv=true/);
  });

  test('hideAccessible → ?fNoAcc=true в URL (FILTER-05)', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Инвалидные парковки' }).check();
    await expect(page).toHaveURL(/fNoAcc=true/);
  });

  test('hideInactive (default true) → toggle off → ?fInactive=false (FILTER-07)', async ({
    page,
  }) => {
    await page.getByRole('checkbox', { name: 'Скрыть неактивные' }).uncheck();
    await expect(page).toHaveURL(/fInactive=false/);
  });

  test('locationType chip in popover → ?fLoc=street (FILTER-06)', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Улица' }).check();
    await expect(page).toHaveURL(/fLoc=street/);
  });

  test('minConf slider в popover → ?fMinConf=... в URL (FILTER-02)', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Минимальная уверенность данных' });
    await slider.fill('0.5');
    await expect(page).toHaveURL(/fMinConf=0\.5/);
  });

  test('maxPay slider в popover → ?fMaxPay=... в URL (FILTER-03)', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Максимальная цена в час' });
    await slider.fill('200');
    await expect(page).toHaveURL(/fMaxPay=200/);
  });

  test('Сброс — кнопка появляется и очищает URL', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Только свободные' }).check();
    await expect(page).toHaveURL(/fNoFree/);
    await page.getByRole('button', { name: /^Сбросить$/ }).click();
    await expect(page).not.toHaveURL(/fNoFree/);
  });

  test('default-skip: toggling hideNoFree off removes ?fNoFree from URL (D-15)', async ({
    page,
  }) => {
    // Start: URL чистый (no fNoFree)
    await expect(page).not.toHaveURL(/fNoFree/);

    // Toggle ON
    const onlyFree = page.getByRole('checkbox', { name: 'Только свободные' });
    await onlyFree.check();
    await expect(page).toHaveURL(/fNoFree=true/);

    // Toggle OFF — должен удалить параметр (clearOnDefault через nuqs)
    await onlyFree.uncheck();
    await expect(page).not.toHaveURL(/fNoFree/);
  });
});
