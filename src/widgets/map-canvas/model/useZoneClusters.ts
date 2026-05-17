// Единый источник истины кластеризации: ZoneClusterLayer рисует кружки
// (zoneCount>1), а ZoneLayer/ParallelZoneLayer/ZoneBadgesLayer рисуют ТОЛЬКО
// зоны-одиночки (singletonIds). Все слои зовут этот хук с одним и тем же
// zoom и одним query-кэшем useFilteredZones → одинаковый мемоизированный
// результат → членство в кластере согласовано между слоями (избыточный
// пересчёт ~200 точек 4× — микросекунды, плумбинг через контекст не нужен).
import { useMemo } from 'react';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { CLUSTER_MERGE_PX } from '@/shared/config';
import { clusterZones, type ClusterResult } from './cluster-zones';

const EMPTY: ClusterResult = { clusters: [], singletonIds: new Set<number>() };

export function useZoneClusters(zoom: number): ClusterResult {
  const { data } = useFilteredZones();
  return useMemo(
    () => (data ? clusterZones(data, zoom, CLUSTER_MERGE_PX) : EMPTY),
    [data, zoom],
  );
}
