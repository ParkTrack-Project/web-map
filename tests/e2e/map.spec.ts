// Playwright smoke для Plan 03: реальный браузер, реальный Vite dev-server,
// MSW в режиме mock через VITE_AUTH_MODE='mock' (см. main.tsx). Yandex CDN
// тянется живьём — на CI понадобится сетевой доступ, иначе тест упадёт
// и должен быть skipped manual'но.
import { test, expect } from '@playwright/test';

test('карта монтируется и показывает overlay с количеством зон', async ({ page }) => {
  await page.goto('/');
  // AuthReady даёт ~500мс mock-задержки, затем рендерится MapPage → MapCanvas →
  // ZoneLayer (после первого ответа /zones). Таймаут с запасом под загрузку
  // ymaps3-CDN на медленных машинах.
  await expect(page.getByTestId('zone-count')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('zone-count')).toContainText(/Зон в видимой области:\s*\d+/);
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
  await expect(page.getByTestId('zone-count')).toBeVisible({ timeout: 15_000 });
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
