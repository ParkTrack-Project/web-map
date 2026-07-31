import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockYandexMaps } from './support/mock-yandex-maps';

const flows: Array<{ name: string; url: string }> = [
  { name: 'main-map', url: '/map' },
  { name: 'with-selected-zone', url: '/map?sel=42' },
  { name: 'with-from-and-dest', url: '/map?from=59.9575,30.3086&dest=59.93,30.32' },
  { name: 'with-route', url: '/map?from=59.9575,30.3086&sel=42&route=1' },
];

test.describe('A11Y axe-core scan (D-25)', () => {
  for (const { name, url } of flows) {
    test(`${name}: critical violations === 0`, async ({ page }) => {
      await mockYandexMaps(page);
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('canvas') // Yandex map canvas — purely visual primary content
        .exclude('[class*="ymaps3"]') // Yandex 3 wrapper elements
        .analyze();

      const critical = results.violations.filter((v) => v.impact === 'critical');
      const serious = results.violations.filter((v) => v.impact === 'serious');

      // D-26: serious/moderate go to a11y-backlog.md (human-curated).
      // This console.warn is the primary signal for human reviewer to update backlog.
      if (serious.length > 0) {
        console.warn(
          `[a11y backlog] ${name}: ${serious.length} serious violations — review and add to web-map/docs/a11y-backlog.md`,
        );
      }

      expect(
        critical,
        `Critical a11y issues in ${name}:\n${JSON.stringify(
          critical.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })),
          null,
          2,
        )}`,
      ).toEqual([]);
    });
  }
});
