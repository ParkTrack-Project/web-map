# Changelog

## Unreleased

### Fixed

- **Address search** перестал «перепрыгивать» в другой город при выборе подсказки. Координаты выбранной подсказки теперь берутся из `SuggestResult.coords` (их кладёт `ymaps3.search` в `suggestAddresses`). Раньше после клика делался повторный resolve по `sug.uri`, в котором хранился только `title` без региона из `subtitle` — Yandex без региона возвращал первый попавшийся объект (например, «Ломоносова 9 Санкт-Петербург» уходил в Великий Новгород). Заодно удалены ставшие мёртвыми `useResolveCoordinates` и `geocodeByUri` (`shared/lib/yandex/geocoder.ts`); экземпляр `isResolving` в загрузочном статусе Desktop-варианта тоже снят.

## [1.0.0-mvp] — Phase 5 verification complete

Final MVP release. Merge from `feat/mvp-rewrite` → `main`.

### Added (Phase 5)

- **Responsive polish (RESP-01..07):** `useVisualViewportHeight` hook for mobile keyboard handling, `h-dvh` migration, `--bottom-sheet-offset` CSS var system, Playwright runtime tap-target test (>=44x44), ESLint guard `no-100vh`.
- **Integration readiness (INTEG-01..06):** Working SharedAuthAdapter (code-ready; real smoke deferred to post-Misha integration), AuthListener for 401 CustomEvent (toast + redirect), Sonner toast system with vaul-compatible z-index, `brand-tokens.ts` single source of truth, StubHeader / Toast / Banner primitives, `.env.example` complete.
- **Real-API toggle (INTEG-04):** `VITE_API_MODE=mock|real` env var, dedicated Playwright `real-api.spec.ts` + config (manual run via `npm run test:e2e:real-api`), filters-contract.md verification protocol.
- **NFR audit (NFR-01..08):** TypeScript strict (noUncheckedIndexedAccess + exactOptionalPropertyTypes + noImplicitOverride + noImplicitReturns), ESLint `no-explicit-any: error`, Vite `manualChunks` (vendor-react / vendor-tanstack / vendor-state / vendor-ui / vendor-icons / vendor-misc), `size-limit` budgets (CI hard-fail), per-endpoint TanStack staleTime tuning per D-32 (NFR-04), CSP header in nginx (verbatim from Yandex docs incl. `csp=202512` migration param), security grep audit, OfflineBanner via TanStack `onlineManager`, atomic-state E2E.
- **A11Y (A11Y-06):** axe-core E2E for 4 critical flows (CRITICAL===0 gate; serious/moderate to backlog), keyboard walkthrough doc, colorblind audit doc.
- **UAT artifacts:** Real-device matrix + 10-step flow checklist + cluster fps measurement methodology + merge-readiness checklist.

### Changed

- 4 widgets wrapped in `React.memo` (NFR-03): ZoneLayer, ParallelZoneLayer, RoutePreviewLayer, DesktopResultsPanel.
- `index.html` Yandex CDN URL appends `&csp=202512` (mandatory until April 2026).
- `shared-adapter.ts` no longer throws — fully implements `AuthAdapter` contract via `/auth/me` cookie call.
- Mode-aware TanStack staleTime per endpoint (NFR-04): `/zones` (now)=30s, `/occupancy` (past)=300s, `/forecasts` (future)=60s, `/zones/:id` (now)=60s.
- ESLint `no-restricted-syntax` blocks `h-screen` / `100vh` regressions (RESP-02 enforcement).

### Carry-over from Phase 4

- **ROUTE-08** real-device deeplink test: covered by UAT flows step 9 + VK/TG step 11-12.

### Known limitations / Deferred to v1.x

- Real Misha-shell smoke: blocked by Misha — deferred to post-MVP integration ticket.
- Real Misha-UI-kit replacement: blocked — placeholder primitives in `shared/ui/`; migration path is single-file barrel swap.
- `eslint-plugin-tailwindcss` for tap-target enforcement: package does NOT support Tailwind 4 (issue #325) — replaced by Playwright runtime test.
- `MobileResultsSheet` two-snap [0.4, 0.85]: Phase 4 CO-02 deferred; if UAT shows UX problem → v1.x.
- VK/TG in-app browser yandexnavi:// behavior: 2.5s fallback acceptable; deeper UX fixes if found in UAT → v1.x.
- Lighthouse perf-score >90: functional NFR audit done; full perf optimization (image lazy-loading, font subsetting, route-based code-split) → v1.x.
- axe serious/moderate findings: backlog in `web-map/docs/a11y-backlog.md`.
- Sentry / monitoring integration: post-MVP integration ticket.
- Default Playwright E2E suite (smoke / map / filters / phase4-smoke / time-selector etc.) currently fails in headless Chrome due to ymaps3 CDN blocked in headless mode (Phase 3 known blocker per STATE.md). Default `npx playwright test` reports many failures; functional verification is delegated to manual UAT flows on real devices in Plan 05-05. The dedicated `tap-targets.spec.ts` and `a11y.spec.ts` use the documented skip-on-ymaps3-failure pattern.
