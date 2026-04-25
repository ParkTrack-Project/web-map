// Playwright smoke для Plan 03 + Plan 02-01: реальный браузер, реальный Vite
// dev-server, MSW в режиме mock через VITE_AUTH_MODE='mock' (см. main.tsx).
// Yandex CDN тянется живьём — на CI понадобится сетевой доступ, иначе тест
// упадёт и должен быть skipped manual'но.
//
// NOTE (Phase 2 Plan 01): Phase 1 ZoneLayer-debug-overlay (data-testid="zone-count")
// удалён в Plan 02-01 Task 3. Сигнал «зоны загрузились» теперь — наличие хотя бы
// одного [data-testid="zone-badge"] на карте (бейджи free_count появляются на
// zoom >= ZONE_BADGE_MIN_ZOOM=14, а DEFAULT_ZOOM=15 → они видны сразу).
import { test, expect } from '@playwright/test';

test('карта монтируется и показывает зоны (badges visible at zoom >= 14)', async ({ page }) => {
  await page.goto('/');
  // AuthReady даёт ~500мс mock-задержки, затем рендерится MapPage → MapCanvas →
  // ZoneLayer (после первого ответа /zones) + ZoneBadgesLayer. Таймаут с запасом
  // под загрузку ymaps3-CDN на медленных машинах.
  const firstBadge = page.getByTestId('zone-badge').first();
  await expect(firstBadge).toBeVisible({ timeout: 15_000 });
});

test('MAP-05: непрерывный пан 5с → не более 3 запросов /zones (debounce + AbortSignal)', async ({
  page,
}) => {
  const zonesRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    // Только GET /zones?... не /zones/<id>
    if (/\/zones(\?|$)/.test(url)) {
      zonesRequests.push(url);
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('zone-badge').first()).toBeVisible({ timeout: 15_000 });
  const initialCount = zonesRequests.length;

  // Непрерывный drag-пан ~5с
  const box = await page.locator('body').boundingBox();
  if (!box) throw new Error('no body box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < 50; i++) {
    await page.mouse.move(cx + (i % 10) * 2, cy + (i % 7) * 2, { steps: 1 });
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await page.waitForTimeout(600); // финальный debounce settle

  const newRequests = zonesRequests.length - initialCount;
  expect(newRequests).toBeLessThanOrEqual(3);
});
