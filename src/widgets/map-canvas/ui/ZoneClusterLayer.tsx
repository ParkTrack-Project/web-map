// Quick-fix 2026-05-17: scale-adaptive кластеризация (см. model/cluster-zones.ts).
import { useContext, type ComponentType, type ReactNode } from 'react';
import { YMapMarker as YMapMarkerRaw } from '@/shared/lib/ymaps';
import { zonePalette } from '@/shared/config';
import { MapRefContext } from '../model/map-ref-context';
import { useZoneClusters } from '../model/useZoneClusters';
import { clusterBubbleSizePx } from '../model/cluster-zones';

interface Props {
  zoom: number;
}

type YMapMarkerProps = {
  coordinates: [number, number];
  zIndex?: number;
  source?: string;
  children?: ReactNode;
};

const YMapMarker = YMapMarkerRaw as unknown as ComponentType<YMapMarkerProps>;

function clusterColor(freeSum: number): string {
  if (freeSum === 0) return zonePalette.full.stroke;
  if (freeSum <= 2) return zonePalette.one.stroke;
  return zonePalette.freeHigh.stroke;
}

export function ZoneClusterLayer({ zoom }: Props) {
  const { clusters } = useZoneClusters(zoom);
  const ctx = useContext(MapRefContext);

  if (clusters.length === 0) return null;

  const drillIn = (center: [number, number]) => {
    const map = ctx?.current;
    if (!map) return;

    try {
      map.setLocation({
        center,
        zoom: Math.min(Math.round(zoom) + 3, 18),
        duration: 300,
      });
    } catch (e) {
      console.warn('[cluster] drill-in setLocation failed:', e);
    }
  };

  return (
    <>
      {clusters.map((cl) => {
        const size = clusterBubbleSizePx(cl.zoneCount);

        return (
          <YMapMarker key={`cluster-${cl.key}`} coordinates={cl.center} zIndex={2100}>
            <button
              type="button"
              data-testid="zone-cluster"
              aria-label={`${cl.zoneCount} парковок, свободно ${cl.freeSum}. Приблизить`}
              title={`${cl.zoneCount} парковок · свободно ${cl.freeSum}`}
              onClick={() => drillIn(cl.center)}
              className="flex cursor-pointer items-center justify-center rounded-full font-semibold text-white shadow-md ring-2 ring-white/70"
              style={{
                width: size,
                height: size,
                backgroundColor: clusterColor(cl.freeSum),
                fontSize: size >= 38 ? 13 : 11,
              }}
            >
              {cl.freeSum}
            </button>
          </YMapMarker>
        );
      })}
    </>
  );
}