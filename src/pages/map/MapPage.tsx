// MAP-01/MAP-07: MapCanvas грузится lazy — сам widget делает top-level await ymaps3.
// MapSkeleton импортится напрямую через subpath (не через barrel), чтобы Vite не
// втянул shared/lib/ymaps в главный chunk — иначе top-level await упадёт ДО монтажа
// React и MapErrorBoundary не сработает (белый экран). См. также 01-VERIFICATION.md.
import { lazy, Suspense } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
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
