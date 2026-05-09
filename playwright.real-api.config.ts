// Phase 5 D-16: dedicated Playwright config for real-API smoke.
// INTENTIONALLY independent — does NOT extend playwright.config.ts so it never
// accidentally runs in default CI. Run manually via `npm run test:e2e:real-api`.
//
// testMatch is scoped to `real-api.spec.ts` only — even if other specs sit in
// the same directory, this config picks up nothing else.
//
// Reporter outputs HTML to phase-05-uat/real-api-report so artifacts are
// committable alongside other UAT evidence (Plan 05-05 collects them).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'real-api.spec.ts',
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: process.env.WEB_MAP_BASE_URL ?? 'http://localhost:5173',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { outputFolder: 'phase-05-uat/real-api-report' }]],
});
