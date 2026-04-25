// ZONE-03 / D-04: parallel-зоны рисуются как полоса (LineString) между midpoint'ами
// двух коротких сторон 4-угольника.
//
// Отдельный YMapFeatureDataSource (zIndex 1901, выше standard-зон) — полосы
// должны быть поверх обычных полигонов, чтобы их было видно даже при пересечении.
// Толщина — фиксированная stroke-width 6px (zoom-aware расчёт можно ввести
// позже; пока стабильная читаемость > zoom-scale).
//
// onClick — stub до Plan 02 (так же как в ZoneLayer.tsx).
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import { YMapFeature, YMapFeatureDataSource, YMapLayer } from '@/shared/lib/ymaps';
import { useViewportZones } from '@/features/viewport-driven-zones';
import { polygonToParallelLine } from '@/shared/lib/geo';
import { computeZoneStyle } from '../model/zone-style';

export function ParallelZoneLayer() {
  const { data, isPending, isError } = useViewportZones();
  if (isPending || isError || !data) return null;

  const parallel = data.filter((z) => z.zone_type === 'parallel');

  return (
    <>
      <YMapFeatureDataSource id="ptk-zones-parallel" />
      <YMapLayer source="ptk-zones-parallel" type="features" zIndex={1901} />
      {parallel.map((z) => {
        const line = polygonToParallelLine(z.geometry);
        if (!line) return null;
        const palette = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: false,
        });
        const geometry = {
          type: 'LineString' as const,
          coordinates: line.coordinates as LngLat[],
        };
        // Для LineString используем stroke (fill игнорируется), ширина 6px.
        return (
          <YMapFeature
            key={z.zone_id}
            id={`zone-parallel-${z.zone_id}`}
            geometry={geometry}
            style={{ stroke: [{ color: palette.stroke, width: 6 }] }}
            source="ptk-zones-parallel"
            onClick={() => {
              // TODO Plan 02
              console.debug('[ptk] parallel zone click', z.zone_id);
            }}
          />
        );
      })}
    </>
  );
}
