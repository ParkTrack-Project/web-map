// ZONE-06 / D-02: redundant encoding — pill с free_count поверх каждой зоны.
import { type ComponentType, type ReactNode } from 'react';
import {
  YMapMarker as YMapMarkerRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import {
  canHoverResultZone,
  shouldDimZone,
  useResultSelection,
  useSelectedZone,
} from '@/features/select-zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { ZONE_BADGE_MIN_ZOOM, MAP_Z } from '@/shared/config';
import { computeZoneStyle } from '../model/zone-style';
import { useZoneClusters } from '../model/useZoneClusters';
import { useI18n } from '@/shared/lib/i18n';
import { usePreferences } from '@/features/preferences';
import { useZoomToZone } from '../model/useZoomToZone';

interface Props {
  zoom: number;
}

type YMapMarkerProps = {
  coordinates: [number, number];
  zIndex?: number;
  source?: string;
  children?: ReactNode;
};

type YMapFeatureDataSourceProps = {
  id: string;
};

type YMapLayerProps = {
  source: string;
  type: string;
  zIndex?: number;
};

const YMapMarker = YMapMarkerRaw as unknown as ComponentType<YMapMarkerProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

export function ZoneBadgesLayer({ zoom }: Props) {
  const { t } = useI18n();
  const { data } = useFilteredZones();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const resultZoneIds = useResultSelection((state) => state.resultZoneIds);
  const hoveredZoneId = useResultSelection((state) => state.hoveredZoneId);
  const markZoneViewed = useResultSelection((state) => state.markZoneViewed);
  const setHoveredZone = useResultSelection((state) => state.setHoveredZone);
  const clearHoveredZone = useResultSelection((state) => state.clearHoveredZone);
  const zoomToZone = useZoomToZone();
  const { singletonIds } = useZoneClusters(zoom);
  const theme = usePreferences((state) => state.theme);

  if (zoom < ZONE_BADGE_MIN_ZOOM) return null;
  if (!data) return null;

  const visible = data.filter(
    (z) => singletonIds.has(z.zone_id) && z.geometry?.coordinates?.length,
  );

  return (
    <>
      <YMapFeatureDataSource id="ptk-badges" />
      <YMapLayer source="ptk-badges" type="markers" zIndex={MAP_Z.zoneBadges} />

      {visible.map((z) => {
        const c = zoneCentroid(z.geometry);

        const { stroke } = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: false,
          theme,
        });

        return (
          <YMapMarker
            key={`badge-${z.zone_id}`}
            source="ptk-badges"
            coordinates={c}
            zIndex={MAP_Z.zoneBadges}
          >
            <div style={{ position: 'relative', width: 0, height: 0 }}>
              <button
                type="button"
                data-testid="zone-badge"
                aria-label={t('map.parkingLabel', { id: z.zone_id, free: z.free_count })}
                onClick={() => {
                  clearHoveredZone(z.zone_id);
                  markZoneViewed(z.zone_id);
                  setSelectedZone(z.zone_id);
                  zoomToZone(z.geometry, { zoneId: z.zone_id });
                }}
                onPointerEnter={() => {
                  if (!canHoverResultZone(z.zone_id, resultZoneIds, singletonIds)) return;
                  setHoveredZone(z.zone_id, 'map');
                }}
                onPointerLeave={() => clearHoveredZone(z.zone_id, 'map')}
                onFocus={() => {
                  if (!canHoverResultZone(z.zone_id, resultZoneIds, singletonIds)) return;
                  setHoveredZone(z.zone_id, 'map');
                }}
                onBlur={() => clearHoveredZone(z.zone_id, 'map')}
                className={`absolute cursor-pointer rounded-full border-0 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap shadow ${theme === 'dark' ? 'text-zinc-950' : 'text-white'}`}
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: stroke,
                  opacity: shouldDimZone(z.zone_id, selectedZoneId, resultZoneIds, hoveredZoneId)
                    ? 0.38
                    : 1,
                }}
              >
                {z.free_count}
              </button>
            </div>
          </YMapMarker>
        );
      })}
    </>
  );
}
