// Quick-fix 2026-05-17: scale-adaptive кластеризация (см. model/cluster-zones.ts).
import { useContext, type ComponentType, type ReactNode } from 'react';
import {
  YMapMarker as YMapMarkerRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { zonePalette, MAP_Z } from '@/shared/config';
import { MapRefContext } from '../model/map-ref-context';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { MAP_MAX_ZOOM } from '@/shared/config';
import { useZoneClusters } from '../model/useZoneClusters';
import { clusterBubbleSizePx } from '../model/cluster-zones';
import { nextClusterExpansionZoom } from '../model/cluster-expansion';
import { useI18n } from '@/shared/lib/i18n';

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

function clusterColor(freeSum: number): string {
  if (freeSum === 0) return zonePalette.full.stroke;
  if (freeSum <= 2) return zonePalette.one.stroke;
  return zonePalette.freeHigh.stroke;
}

export function ZoneClusterLayer({ zoom }: Props) {
  const { t } = useI18n();
  const { clusters } = useZoneClusters(zoom);
  const { data: zones = [] } = useFilteredZones();
  const ctx = useContext(MapRefContext);

  if (clusters.length === 0) return null;

  const drillIn = (center: [number, number], zoneIds: number[]) => {
    const map = ctx?.current;
    if (!map) return;

    try {
      const currentZoom = (map as { zoom?: number }).zoom ?? zoom;
      const maxZoom = (map as { zoomRange?: { max?: number } }).zoomRange?.max ?? MAP_MAX_ZOOM;
      map.setLocation({
        center,
        zoom: nextClusterExpansionZoom({ zones, zoneIds, currentZoom, maxZoom }),
        duration: 300,
      });
    } catch (e) {
      console.warn('[cluster] drill-in setLocation failed:', e);
    }
  };

  return (
    <>
      {/* Кружки кластеров — в ОТДЕЛЬНОМ marker-слое (как бейджи зон), а не в
          дефолтном features-слое Яндекса. Иначе они оказываются ВНУТРИ того же
          слоя, где живёт встроенная парковка Яндекса («секторы»), и та их
          перекрывает. Свой слой с zIndex=MAP_Z.cluster кладёт кружки ПОВЕРХ
          всего дефолтного features-слоя (вместе с парковкой). */}
      <YMapFeatureDataSource id="ptk-clusters" />
      <YMapLayer source="ptk-clusters" type="markers" zIndex={MAP_Z.cluster} />

      {clusters.map((cl) => {
        const size = clusterBubbleSizePx(cl.zoneCount);

        return (
          <YMapMarker
            key={`cluster-${cl.key}`}
            source="ptk-clusters"
            coordinates={cl.center}
            zIndex={MAP_Z.cluster}
          >
            {/* Центрируем кружок на координате кластера: YMapMarker по умолчанию
                ставит в точку ЛЕВЫЙ ВЕРХНИЙ угол элемента, из-за чего кружок
                «съезжал» вправо-вниз на полразмера. Нулевой wrapper + absolute
                button с translate(-50%,-50%) — тот же приём, что у бейджей зон
                (ZoneBadgesLayer). */}
            <div style={{ position: 'relative', width: 0, height: 0 }}>
              <button
                type="button"
                data-testid="zone-cluster"
                aria-label={t('map.clusterLabel', { count: cl.zoneCount, free: cl.freeSum })}
                title={t('map.clusterTitle', { count: cl.zoneCount, free: cl.freeSum })}
                onClick={() => drillIn(cl.center, cl.zoneIds)}
                className="absolute flex cursor-pointer items-center justify-center rounded-full font-semibold text-white shadow-md ring-2 ring-white/70"
                style={{
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  backgroundColor: clusterColor(cl.freeSum),
                  fontSize: size >= 38 ? 13 : 11,
                }}
              >
                {cl.freeSum}
              </button>
            </div>
          </YMapMarker>
        );
      })}
    </>
  );
}
