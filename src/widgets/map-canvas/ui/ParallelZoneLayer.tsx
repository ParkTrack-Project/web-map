// ZONE-03 / D-04: parallel-зоны рисуются как полоса (LineString).
import { memo, type ComponentType } from 'react';
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import {
  YMapFeature as YMapFeatureRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { MAP_Z } from '@/shared/config';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useSelectedZone } from '@/features/select-zone';
import { polygonToParallelLine } from '@/shared/lib/geo';
import { computeZoneStyle } from '../model/zone-style';
import { useZoomToZone } from '../model/useZoomToZone';
import { usePreferences } from '@/features/preferences';

type LineStringGeometry = {
  type: 'LineString';
  coordinates: LngLat[];
};

type YMapFeatureProps = {
  id: string;
  geometry: LineStringGeometry;
  style: {
    stroke: Array<{
      color: string;
      width: number;
    }>;
  };
  source: string;
  onClick?: () => void;
};

type YMapFeatureDataSourceProps = {
  id: string;
};

type YMapLayerProps = {
  source: string;
  type: string;
  zIndex?: number;
};

const YMapFeature = YMapFeatureRaw as unknown as ComponentType<YMapFeatureProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

function ParallelZoneLayerInner() {
  const { data } = useFilteredZones();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const zoomToZone = useZoomToZone();
  const theme = usePreferences((state) => state.theme);

  if (!data) return null;

  // 2026-05-30: рисуем ВСЕ parallel-зоны, даже схлопнутые в кластер — полигоны
  // (полосы) остаются видны под кружком ZoneClusterLayer. Раньше — только singletonIds.
  const parallel = data.filter(
    (z) => z.zone_type === 'parallel' && z.geometry?.coordinates?.length,
  );

  return (
    <>
      <YMapFeatureDataSource id="ptk-zones-parallel" />
      <YMapLayer source="ptk-zones-parallel" type="features" zIndex={MAP_Z.zoneParallel} />

      {parallel.map((z) => {
        const line = polygonToParallelLine(z.geometry);
        if (!line) return null;

        const palette = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: z.zone_id === selectedZoneId,
          theme,
        });

        const geometry: LineStringGeometry = {
          type: 'LineString',
          coordinates: line.coordinates as LngLat[],
        };

        const strokeWidth = z.zone_id === selectedZoneId ? 8 : 6;

        return (
          <YMapFeature
            key={z.zone_id}
            id={`zone-parallel-${z.zone_id}`}
            geometry={geometry}
            style={{ stroke: [{ color: palette.stroke, width: strokeWidth }] }}
            source="ptk-zones-parallel"
            onClick={() => {
              setSelectedZone(z.zone_id);
              // клик по карте → приближаем к зоне, дотягивая до выхода из кластера
              zoomToZone(z.geometry, { zoneId: z.zone_id });
            }}
          />
        );
      })}
    </>
  );
}

export const ParallelZoneLayer = memo(ParallelZoneLayerInner);
