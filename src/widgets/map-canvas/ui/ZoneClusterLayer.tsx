// Quick-fix 2026-05-17: scale-adaptive кластеризация (см. model/cluster-zones.ts).
//
// Раньше слой работал ТОЛЬКО на zoom < CLUSTER_ZOOM_THRESHOLD (бинарный режим:
// либо всё в кластерах, либо ни одной группировки). Теперь слой активен на
// ЛЮБОМ зуме и рисует только мультикластеры (zoneCount>1) из общего хука
// useZoneClusters — членство согласовано с полигон/бейдж-слоями (они рисуют
// singletonIds). При отдалении кружков становится больше, при приближении
// они распадаются по одной зоне — переход непрерывный, без порога зума.
//
// Цвет — палитра D-01 (red/amber/green) по сумме свободных мест.
// Клик по кластеру — приближение на +3 зума к его центру (drill-in); дальше
// onUpdate перепишет ?bbox/?z, кластер распадётся, зоны подгрузятся точно.
import { useContext } from 'react';
import { YMapMarker } from '@/shared/lib/ymaps';
import { zonePalette } from '@/shared/config';
import { MapRefContext } from '../model/map-ref-context';
import { useZoneClusters } from '../model/useZoneClusters';

interface Props {
  zoom: number;
}

function clusterColor(freeSum: number): string {
  // Solid stroke-цвета (без альфы) — контрастны с белым текстом, как у бейджей.
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
        // Размер кружка слегка растёт с числом зон (28..44px).
        const size = Math.min(28 + Math.floor(cl.zoneCount / 4) * 4, 44);
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
