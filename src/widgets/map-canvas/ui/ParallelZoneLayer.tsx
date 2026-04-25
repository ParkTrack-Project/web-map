// ZONE-03 / D-04: parallel-зоны рисуются как полоса (LineString) между midpoint'ами
// двух коротких сторон 4-угольника.
//
// Отдельный YMapFeatureDataSource (zIndex 1901, выше standard-зон) — полосы
// должны быть поверх обычных полигонов, чтобы их было видно даже при пересечении.
// Толщина — фиксированная stroke-width 6px (zoom-aware расчёт можно ввести
// позже; пока стабильная читаемость > zoom-scale).
//
// Plan 02-02 wiring: клик → setSelectedZone(z.zone_id), выбранная зона получает
// stroke-width 8 (вместо 6) для визуального отличия (D-08 для LineString-варианта).
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import { YMapFeature, YMapFeatureDataSource, YMapLayer } from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useSelectedZone } from '@/features/select-zone';
import { polygonToParallelLine } from '@/shared/lib/geo';
import { computeZoneStyle } from '../model/zone-style';

export function ParallelZoneLayer() {
  // Phase 2 Plan 03: переключено на useFilteredZones (фильтры применены).
  // useSelectedZone wiring (Plan 02) сохранён.
  const { data, isPending, isError } = useFilteredZones();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
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
          selected: z.zone_id === selectedZoneId, // D-08
        });
        const geometry = {
          type: 'LineString' as const,
          coordinates: line.coordinates as LngLat[],
        };
        // Для LineString используем stroke (fill игнорируется), ширина 6 / 8 (selected).
        const strokeWidth = z.zone_id === selectedZoneId ? 8 : 6;
        return (
          <YMapFeature
            key={z.zone_id}
            id={`zone-parallel-${z.zone_id}`}
            geometry={geometry}
            style={{ stroke: [{ color: palette.stroke, width: strokeWidth }] }}
            source="ptk-zones-parallel"
            onClick={() => setSelectedZone(z.zone_id)}
          />
        );
      })}
    </>
  );
}
