import { memo, type ComponentType } from 'react';
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import {
  YMapFeature as YMapFeatureRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { MAP_Z } from '@/shared/config';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { shouldDimZone, useResultSelection, useSelectedZone } from '@/features/select-zone';
import { computeZoneStyle, toDrawingStyle } from '../model/zone-style';
import { useZoomToZone } from '../model/useZoomToZone';
import { usePreferences } from '@/features/preferences';

type PolygonGeometry = {
  type: 'Polygon';
  coordinates: LngLat[][];
};

type YMapFeatureProps = {
  id: string;
  geometry: PolygonGeometry;
  style: ReturnType<typeof toDrawingStyle>;
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

// reactify-обёртки из shared/lib/ymaps после динамической загрузки могут терять
// JSX-тип. Поэтому локально приводим их к ComponentType.
const YMapFeature = YMapFeatureRaw as unknown as ComponentType<YMapFeatureProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

function ZoneLayerInner() {
  const { data } = useFilteredZones();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const resultZoneIds = useResultSelection((state) => state.resultZoneIds);
  const markZoneViewed = useResultSelection((state) => state.markZoneViewed);
  const zoomToZone = useZoomToZone();
  const theme = usePreferences((state) => state.theme);

  if (!data) return null;

  const standard = data.filter(
    (z) => z.zone_type === 'standard' && z.geometry?.coordinates?.length,
  );

  return (
    <>
      <YMapFeatureDataSource id="ptk-zones-standard" />
      <YMapLayer source="ptk-zones-standard" type="features" zIndex={MAP_Z.zonePolygons} />

      {standard.map((z) => {
        const style = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: z.zone_id === selectedZoneId,
          dimmed: shouldDimZone(z.zone_id, selectedZoneId, resultZoneIds),
          theme,
        });

        const geometry: PolygonGeometry = {
          type: 'Polygon',
          coordinates: z.geometry.coordinates as LngLat[][],
        };

        return (
          <YMapFeature
            key={z.zone_id}
            id={`zone-${z.zone_id}`}
            geometry={geometry}
            style={toDrawingStyle(style)}
            source="ptk-zones-standard"
            onClick={() => {
              markZoneViewed(z.zone_id);
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

export const ZoneLayer = memo(ZoneLayerInner);
