# FSD architectural exceptions

Phase 1-4 surfaced 2 cross-layer imports that violate the strict FSD rule
(entities ↔ entities, features ↔ features, widgets ↔ widgets) but were
ALLOWED via barrel re-export. This document logs them so reviewers know they
are intentional, not regressions.

## Allowed cross-layer imports

### 1. ZoneCard widget → MapCanvas widget (shared map-instance)

- **Files:** `web-map/src/widgets/zone-card/ui/MobileZoneCard.tsx` imports from
  `@/widgets/map-canvas`
- **Rationale:** ZoneCard's CARD-07 «center map on selected zone» feature
  requires the YMap ref. The ref lives in MapRefContext
  (widgets/map-canvas/model). Lifting it higher (to pages/) was rejected as
  over-engineering for one cross-widget consumer.
- **Phase:** 02 Plan 02
- **STATE.md ref:** «Cross-widget импорт widgets/zone-card → widgets/map-canvas
  разрешён только через barrel»
- **Enforcement:** allowed because eslint pattern `@/widgets/*/*` blocks
  subpath imports — barrel imports (`@/widgets/map-canvas`) bypass the rule
  legitimately.

### 2. useFilteredZones cross-feature import via barrel

- **Files:** `web-map/src/features/viewport-driven-zones` exports
  `useFilteredZones` which imports from `@/features/filter-zones`
- **Rationale:** The two features both consume URL filter state. Splitting
  them into a shared `entities/zone/lib/filters.ts` was deferred — both are
  tightly coupled to the same URL parser.
- **Phase:** 02 Plan 03
- **STATE.md ref:** «Plan 03: useFilteredZones импортит features/filter-zones
  (cross-feature) — допустимо через barrel»
- **Enforcement:** allowed because eslint pattern `@/features/*/*` blocks
  subpath imports — barrel imports (`@/features/filter-zones`) bypass
  legitimately.

## Lessons for v1.x cleanup

Both exceptions stem from the same root cause: state that is conceptually
shared between two layer-peers (widgets-widgets, features-features). The clean
refactor is to lift the shared state to the next layer down (widgets→shared,
features→entities or shared). Cost-benefit said «not worth it for MVP»; v1.x
can revisit if more cross-imports needed.
