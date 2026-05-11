// FILTER-12 / D-13: каждый из 7 фильтров пишется в URL отдельным параметром.
// D-15: дефолтные значения не сериализуются — toggle ON-then-OFF удаляет
// ?f-param из URL (default-skip behavior, обеспечивается nuqs clearOnDefault).
// Этот тест переключает каждый фильтр через UI и проверяет, что URL обновлён.
//
// Замечание: FILTER-02/03/06 теперь под Radix Popover'ом (D-09 — Issue #2 fix).
// E2E сначала открывает popover (click trigger), затем взаимодействует со
// slider'ом / чек-боксом внутри.
//
// Полная DOM-проверка изменения количества зон зависит от реального ymaps3
// рендера — здесь surrogate-проверка через URL-state (надёжна в jsdom-like
// окружении). Реальное interactive validation — HUMAN-UAT.
import { test, expect } from '@playwright/test';

test.describe('Phase 2 filters — URL serialization (FILTER-12)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ждём mount FiltersToolbar
    await expect(page.getByRole('toolbar', { name: 'Фильтры парковок' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('hideNoFree → ?fNoFree=true в URL (FILTER-01)', async ({ page }) => {
    await page.getByRole('button', { name: /Только свободные/ }).click();
    await expect(page).toHaveURL(/fNoFree=true/);
  });

  test('hidePrivate → ?fNoPriv=true в URL (FILTER-04)', async ({ page }) => {
    await page.getByRole('button', { name: /Без частных/ }).click();
    await expect(page).toHaveURL(/fNoPriv=true/);
  });

  test('hideAccessible → ?fNoAcc=true в URL (FILTER-05)', async ({ page }) => {
    await page.getByRole('button', { name: /Без для инвалидов/ }).click();
    await expect(page).toHaveURL(/fNoAcc=true/);
  });

  test('hideInactive (default true) → toggle off → ?fInactive=false (FILTER-07)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Скрыть неактивные/ }).click();
    await expect(page).toHaveURL(/fInactive=false/);
  });

  test('locationType chip in popover → ?fLoc=street (FILTER-06)', async ({ page }) => {
    // Sub-step: открыть popover (chip-trigger «Тип: все») → внутри отметить чек-бокс «Улица»
    await page.getByRole('button', { name: /Тип расположения парковки/ }).click();
    await page.getByRole('checkbox', { name: 'Улица' }).check();
    await expect(page).toHaveURL(/fLoc=street/);
  });

  test('minConf slider в popover → ?fMinConf=... в URL (FILTER-02)', async ({ page }) => {
    // Sub-step: открыть popover «Уверенность ≥ 0%» → взаимодействовать со slider'ом
    await page.getByRole('button', { name: /Минимальная уверенность данных/ }).click();
    // .nth(1): aria-label дублируется на trigger'е и на range-input'е внутри popover
    const slider = page.getByLabel('Минимальная уверенность данных').nth(1);
    await slider.fill('0.5');
    await expect(page).toHaveURL(/fMinConf=0\.5/);
  });

  test('maxPay slider в popover → ?fMaxPay=... в URL (FILTER-03)', async ({ page }) => {
    await page.getByRole('button', { name: /Максимальная цена в час/ }).click();
    const slider = page.getByLabel('Максимальная цена в час').nth(1);
    await slider.fill('200');
    await expect(page).toHaveURL(/fMaxPay=200/);
  });

  test('Сброс — кнопка появляется и очищает URL', async ({ page }) => {
    await page.getByRole('button', { name: /Только свободные/ }).click();
    await expect(page).toHaveURL(/fNoFree/);
    await page.getByRole('button', { name: /^Сбросить$/ }).click();
    await expect(page).not.toHaveURL(/fNoFree/);
  });

  // D-15 default-skip explicit test
  test('default-skip: toggling hideNoFree off removes ?fNoFree from URL (D-15)', async ({
    page,
  }) => {
    // Start: URL чистый (no fNoFree)
    await expect(page).not.toHaveURL(/fNoFree/);

    // Toggle ON
    await page.getByRole('button', { name: /Только свободные/i }).click();
    await expect(page).toHaveURL(/fNoFree=true/);

    // Toggle OFF — должен удалить параметр (clearOnDefault через nuqs)
    await page.getByRole('button', { name: /Только свободные/i }).click();
    await expect(page).not.toHaveURL(/fNoFree/);
  });
});
