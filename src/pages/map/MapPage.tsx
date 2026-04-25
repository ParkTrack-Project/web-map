// MAP-01: MapCanvas грузится lazy — сам widget делает top-level await ymaps3,
// поэтому первое разрешение модуля происходит только когда страница реально
// нужна. Suspense fallback показывает MapSkeleton (UX-01) на эти 0–500мс.
// MapErrorBoundary ловит CDN-fail и рендерит list-only fallback (MAP-07).
import { lazy, Suspense } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas').then((m) => ({ default: m.MapCanvas })),
);

export function MapPage() {
  return (
    <div className="h-screen w-screen">
      <MapErrorBoundary>
        <Suspense fallback={<MapSkeleton />}>
          <MapCanvas />
        </Suspense>
      </MapErrorBoundary>
    </div>
  );
}
