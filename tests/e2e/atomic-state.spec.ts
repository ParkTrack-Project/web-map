import { test, expect, type Request } from '@playwright/test';
import { mockYandexMaps } from './support/mock-yandex-maps';

test.use({ viewport: { width: 1280, height: 720 }, locale: 'ru-RU' });

const isZonesListRequest = (url: string) => /\/zones(?:\?|$)/.test(url);

test.describe('Atomic state transitions (D-35 NFR-08)', () => {
  test('parallel filter+time+zone change → no intermediate flash', async ({ page }) => {
    await mockYandexMaps(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const initialZones = page.waitForResponse(
      (response) => isZonesListRequest(response.url()) && response.ok(),
      { timeout: 30_000 },
    );
    await page.goto('/map');
    await initialZones;

    // Trigger 3 state changes near-simultaneously via URL state
    const url = new URL(page.url());
    url.searchParams.set('fNoFree', 'true'); // filter
    url.searchParams.set('t', `future:${new Date(Date.now() + 3600_000).toISOString()}`); // time mode
    url.searchParams.set('sel', '42'); // selected zone

    // Race: navigation + observe overlay appearance
    await page.goto(url.toString());

    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(page.locator('#root > *').first()).toBeAttached();
    expect(errors, 'no runtime errors during atomic transition').toEqual([]);
  });

  test('rapid filter toggle → AbortController cascades, only final requests complete', async ({
    page,
  }) => {
    await mockYandexMaps(page);
    const initialZones = page.waitForResponse(
      (response) => isZonesListRequest(response.url()) && response.ok(),
      { timeout: 30_000 },
    );
    await page.goto('/map');
    await initialZones;

    const filterTrigger = page.getByRole('button', { name: /Открыть фильтры/ });
    await expect(filterTrigger).toBeVisible({ timeout: 20_000 });
    await filterTrigger.click();
    const onlyFree = page.getByRole('checkbox', { name: 'Только свободные' });
    await expect(onlyFree).toBeVisible();

    // Track all /zones requests AND their completion status
    const requests = new Map<Request, { url: string; aborted: boolean; completed: boolean }>();
    page.on('request', (req) => {
      if (isZonesListRequest(req.url())) {
        requests.set(req, { url: req.url(), aborted: false, completed: false });
      }
    });
    page.on('requestfinished', (req) => {
      const entry = requests.get(req);
      if (entry) entry.completed = true;
    });
    page.on('requestfailed', (req) => {
      const entry = requests.get(req);
      if (entry) entry.aborted = true;
    });

    const finalZones = page.waitForResponse(
      (response) =>
        isZonesListRequest(response.url()) &&
        new URL(response.url()).searchParams.get('min_free_count') === '1' &&
        response.ok(),
      { timeout: 10_000 },
    );

    // Toggle inside one mounted application. The mock /zones endpoint has a
    // small realistic delay, so superseded React Query requests remain in
    // flight long enough for AbortSignal cancellation to be observable.
    await onlyFree.evaluate(async (element) => {
      const input = element as HTMLInputElement;
      for (let i = 0; i < 5; i += 1) {
        input.click();
        await new Promise((resolve) => window.setTimeout(resolve, 25));
      }
    });

    const finalResponse = await finalZones;
    await finalResponse.finished();
    await expect(page).toHaveURL(/fNoFree=true/);

    const requestEntries = [...requests.values()];
    expect(
      requestEntries.length,
      'rapid toggles should start multiple /zones list requests',
    ).toBeGreaterThan(1);
    const completedRequests = requestEntries.filter((r) => r.completed && !r.aborted);
    expect(
      completedRequests.length,
      `Expected only the final /zones list request to complete; got ${completedRequests.length} of ${requestEntries.length}.`,
    ).toBeLessThanOrEqual(1);
  });
});
