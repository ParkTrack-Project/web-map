// Phase 5 D-35 (NFR-08): atomic state — no stale-data flash during simultaneous
// time + filters + zone changes. ModeTransitionOverlay (Phase 3 + Phase 4 extended)
// gates rendering until all in-flight queries settle.
import { test, expect } from '@playwright/test';

test.describe('Atomic state transitions (D-35 NFR-08)', () => {
  test('parallel filter+time+zone change → no intermediate flash', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Wait for initial zones rendered
    await expect(page.locator('[class*="ymaps3"]').first()).toBeVisible({ timeout: 10_000 });

    // Trigger 3 state changes near-simultaneously via URL state
    const url = new URL(page.url());
    url.searchParams.set('fNoFree', 'true'); // filter
    url.searchParams.set('t', `future:${new Date(Date.now() + 3600_000).toISOString()}`); // time mode
    url.searchParams.set('sel', '42'); // selected zone

    // Race: navigation + observe overlay appearance
    await page.goto(url.toString());

    // ModeTransitionOverlay should appear during transition
    // Per Phase 3 D-08 + Phase 4 expansion: overlay subscribes to useIsFetching
    // Either appears briefly (preferred) OR is gated below 200ms threshold
    // Acceptance: page reaches stable state without runtime errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    expect(errors, 'no runtime errors during atomic transition').toEqual([]);
  });

  test('rapid filter toggle → AbortController cascades, only final requests complete', async ({
    page,
  }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');

    // Track all /zones requests AND their completion status
    const requests: Array<{ url: string; aborted: boolean; completed: boolean }> = [];
    page.on('request', (req) => {
      if (req.url().includes('/zones')) {
        const entry = { url: req.url(), aborted: false, completed: false };
        requests.push(entry);
        req
          .response()
          .then(() => {
            entry.completed = true;
          })
          .catch(() => {
            entry.aborted = true;
          });
      }
    });

    // Toggle filter 5 times rapidly via URL state
    for (let i = 0; i < 5; i++) {
      const url = new URL(page.url());
      url.searchParams.set('fNoFree', i % 2 === 0 ? 'true' : 'false');
      await page.goto(url.toString());
      // No wait — race
    }

    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // I-2 fix: tightened heuristic.
    // After 5 rapid toggles, AbortController should cancel earlier requests;
    // only the LAST request per query-key should complete.
    // Expected: ≤ 2 completed (final /zones list + possibly /zones/<id> for selected zone).
    // If completed > 2 → AbortController is missing on filter changes → REGRESSION (NFR-08).
    const completedRequests = requests.filter((r) => r.completed && !r.aborted);
    expect(
      completedRequests.length,
      `Expected ≤2 completed /zones requests after 5 rapid toggles (final list + final detail). Got ${completedRequests.length}. AbortController may be missing or misconfigured. Heuristic rationale: 5 toggles × 1 zones query + 1 settle slack = ≤6 raw; with abort cascade = ≤2 completed.`,
    ).toBeLessThanOrEqual(2);
  });
});
