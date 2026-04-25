// MAP-01/MAP-07: MapCanvas грузится lazy — сам widget делает top-level await ymaps3.
// MapSkeleton импортится напрямую через subpath (не через barrel), чтобы Vite не
// втянул shared/lib/ymaps в главный chunk — иначе top-level await упадёт ДО монтажа
// React и MapErrorBoundary не сработает (белый экран). См. также 01-VERIFICATION.md.
//
// Phase 2 Plan 02 Task 4 baseline композиция:
//   - <MapCanvas/> (lazy) — карта с zone-layer'ами.
//   - <ZoneCard/> — desktop overlay (имеет встроенный hidden lg:block).
//   - <MobileZoneCard/> — mobile vaul Portal (имеет встроенный lg:hidden на overlay/content).
// Оба варианта карточки слушают один useSelectedZone() — открытие/закрытие
// синхронизировано через URL ?sel=<id>. CSS @media решает, который виден.
//
// КОНТРАКТ Plan 03 (wave 3): Plan 03 переработает MapPage в DesktopLayout/
// MobileLayout split (с FiltersToolbar/FiltersFAB), СОХРАНИВ рендер
// <ZoneCard/> внутри DesktopLayout и <MobileZoneCard/> внутри MobileLayout.
//
// Контейнер: relative + overflow-hidden — чтобы ZoneCard с position:absolute
// right:0 приклеился именно к нему, а не к viewport, и не выходил за пределы.
import { lazy, Suspense } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { ZoneCard, MobileZoneCard } from '@/widgets/zone-card';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MapPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapErrorBoundary>
        <Suspense fallback={<MapSkeleton />}>
          <MapCanvas />
        </Suspense>
      </MapErrorBoundary>
      {/* Desktop card overlay (lg+) */}
      <ZoneCard />
      {/* Mobile vaul bottom-sheet (lg:hidden внутри Portal/Content классов) */}
      <MobileZoneCard />
    </div>
  );
}
