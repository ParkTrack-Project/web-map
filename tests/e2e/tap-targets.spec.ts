// Phase 5 D-04 (RESP-06): runtime tap-target enforcement.
//
// Research finding: eslint-plugin-tailwindcss НЕ поддерживает Tailwind 4 (issue #325 open),
// поэтому статический ESLint-rule на min-h-11/min-w-11 невозможен. Этот Playwright тест —
// единственный enforcement-mechanism для WCAG 2.5.5 (Target Size 44x44).
//
// Тест эмулирует iPhone 13 (390x844 viewport), переходит на /, ждёт пока mobile UI
// смонтируется (FiltersFAB), затем проверяет computed bounding box каждой interactive
// element'и (button / a / [role=button]). Элементы внутри <canvas>, <svg>, .ymaps3-controls
// пропускаются (Yandex рисует их в canvas).
//
// ymaps3 CDN может fail в headless Chrome (Phase 3 known blocker per STATE.md). В этом
// случае top-level await @/shared/lib/ymaps бросает TypeError, и весь page crash'ится
// до того, как FiltersFAB смонтируется. Когда селектор не находит FAB → skip с reason.
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test.describe('RESP-06: tap targets >= 44x44 on mobile', () => {
  test('all buttons and links meet WCAG 2.5.5 minimum size', async ({ page }) => {
    await page.goto('/').catch(() => {});

    // FiltersFAB — sibling MapCanvas Suspense, должен монтироваться сразу после
    // AuthReady (~500мс mock). Если за 10с ничего → ymaps3 CDN broke page.
    const fabFound = await page
      .waitForSelector('button[aria-label*="Открыть фильтры"]', { timeout: 10_000 })
      .catch(() => null);
    if (!fabFound) {
      test.skip(
        true,
        'ymaps3 CDN unavailable в headless Chrome — Phase 3 known blocker (STATE.md)',
      );
    }
    // Дополнительный buffer чтобы дождаться рендера всех floating chips.
    await page.waitForTimeout(800);

    const failures: Array<{ selector: string; w: number; h: number }> = [];
    const handles = await page.$$('button, a, [role="button"]');

    for (const handle of handles) {
      // Skip элементы внутри Yandex map canvas (рисуются в canvas, реальные DOM
      // wrapper'ы без real bounding box; controls обрабатываются ymaps3, а не нами).
      const insideMapInternals = await handle.evaluate((el) => {
        return Boolean(el.closest('canvas, svg, [class*="ymaps3-controls"]'));
      });
      if (insideMapInternals) continue;

      // Skip скрытые элементы (display:none → boundingBox null; w/h=0 для прозрачных).
      const box = await handle.boundingBox();
      if (!box) continue;
      if (box.width === 0 || box.height === 0) continue;

      if (box.width < 44 || box.height < 44) {
        const tag = await handle.evaluate((el) => {
          const cls = typeof el.className === 'string' ? el.className : '';
          const id = el.id ? `#${el.id}` : '';
          const aria = el.getAttribute('aria-label');
          return (
            el.tagName +
            id +
            (cls ? `.${cls.trim().split(/\s+/).join('.')}` : '') +
            (aria ? `[aria-label="${aria}"]` : '')
          );
        });
        failures.push({ selector: tag, w: box.width, h: box.height });
      }
    }

    expect(
      failures,
      `Tap target violations (need >= 44x44):\n${failures
        .map((f) => `  ${f.selector}: ${f.w}x${f.h}`)
        .join('\n')}`,
    ).toEqual([]);
  });
});
