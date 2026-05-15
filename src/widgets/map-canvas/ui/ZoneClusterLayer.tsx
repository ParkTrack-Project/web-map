// Quick-fix 2026-05-16 (п.7): кластеризация зон на малом зуме.
//
// Готового кластерера в проекте нет (пользователь выбрал «своё лёгкое
// решение»). На zoom < CLUSTER_ZOOM_THRESHOLD вместо ~200 крошечных полигонов
// рисуем агрегированные кружки: центроиды зон бакетятся в сетку, ячейка
// зависит от зума (≈80px). В кружке — суммарно свободных мест по кластеру;
// цвет — из той же палитры D-01 (red/amber/green), как у полигонов и бейджей.
// Клик по кластеру — приближение на +3 зума к его центру (drill-in); дальше
// onUpdate сам перепишет ?bbox/?z и зоны подгрузятся полигонами.
//
// На zoom >= CLUSTER_ZOOM_THRESHOLD слой ничего не рисует (полигоны + бейджи
// берут управление — см. MapCanvas-гейт).
import { useContext, useMemo } from 'react';
import { YMapMarker } from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { zoneCentroid } from '@/shared/lib/geo';
import { CLUSTER_ZOOM_THRESHOLD, zonePalette } from '@/shared/config';
import { MapRefContext } from '../model/map-ref-context';

interface Props {
  zoom: number;
}

interface Cluster {
  key: string;
  center: [number, number]; // [lon, lat] — порядок ymaps3
  freeSum: number;
  zoneCount: number;
}

// Размер ячейки сетки в градусах ≈ 80px на текущем зуме (Web Mercator по lon).
function cellDegFor(zoom: number): number {
  return (360 * 80) / (256 * 2 ** zoom);
}

function clusterColor(freeSum: number): string {
  // Solid stroke-цвета (без альфы) — контрастны с белым текстом, как у бейджей.
  if (freeSum === 0) return zonePalette.full.stroke;
  if (freeSum <= 2) return zonePalette.one.stroke;
  return zonePalette.freeHigh.stroke;
}

export function ZoneClusterLayer({ zoom }: Props) {
  const { data } = useFilteredZones();
  const ctx = useContext(MapRefContext);

  const clusters = useMemo<Cluster[]>(() => {
    if (!data || zoom >= CLUSTER_ZOOM_THRESHOLD) return [];
    const cell = cellDegFor(zoom);
    const acc = new Map<
      string,
      { sumLon: number; sumLat: number; count: number; free: number }
    >();
    for (const z of data) {
      const [lon, lat] = zoneCentroid(z.geometry);
      const key = `${Math.floor(lon / cell)}:${Math.floor(lat / cell)}`;
      const cur = acc.get(key) ?? { sumLon: 0, sumLat: 0, count: 0, free: 0 };
      cur.sumLon += lon;
      cur.sumLat += lat;
      cur.count += 1;
      cur.free += z.is_active ? z.free_count : 0;
      acc.set(key, cur);
    }
    return Array.from(acc.entries()).map(([key, c]) => ({
      key,
      center: [c.sumLon / c.count, c.sumLat / c.count] as [number, number],
      freeSum: c.free,
      zoneCount: c.count,
    }));
  }, [data, zoom]);

  if (zoom >= CLUSTER_ZOOM_THRESHOLD || clusters.length === 0) return null;

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
