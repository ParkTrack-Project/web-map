import type { ZoneMapItem } from '@/entities/zone';
import {
  CLUSTER_EXPANSION_SEARCH_STEP,
  CLUSTER_EXPANSION_ZOOM_BUFFER,
  CLUSTER_MAX_FREE_BANDS,
  CLUSTER_MERGE_PX,
} from '@/shared/config';
import { clusterZones } from './cluster-zones';

export function maxClusterFreeForZoom(zoom: number): number {
  for (const band of CLUSTER_MAX_FREE_BANDS) {
    if (zoom < band.belowZoom) return band.cap;
  }
  return Infinity;
}

export function clusterZonesForZoom(zones: ZoneMapItem[], zoom: number) {
  return clusterZones(zones, zoom, CLUSTER_MERGE_PX, maxClusterFreeForZoom(zoom));
}

interface NextClusterExpansionZoomOptions {
  zones: ZoneMapItem[];
  zoneIds: readonly number[];
  currentZoom: number;
  maxZoom: number;
  searchStep?: number;
  buffer?: number;
}

function remainsOneCluster(zones: ZoneMapItem[], zoneIds: Set<number>, zoom: number): boolean {
  return clusterZonesForZoom(zones, zoom).clusters.some((cluster) => {
    if (cluster.zoneIds.length < zoneIds.size) return false;
    const members = new Set(cluster.zoneIds);
    return [...zoneIds].every((id) => members.has(id));
  });
}

/**
 * Возвращает ближайший zoom, на котором участники выбранного кластера уже не
 * входят все вместе в один агрегированный кружок. При неделимом кластере
 * возвращает максимум карты. Результат никогда не меньше текущего zoom.
 */
export function nextClusterExpansionZoom({
  zones,
  zoneIds,
  currentZoom,
  maxZoom,
  searchStep = CLUSTER_EXPANSION_SEARCH_STEP,
  buffer = CLUSTER_EXPANSION_ZOOM_BUFFER,
}: NextClusterExpansionZoomOptions): number {
  const safeMax = Math.max(currentZoom, maxZoom);
  if (currentZoom >= safeMax || zoneIds.length < 2 || searchStep <= 0) return safeMax;

  const selectedIds = new Set(zoneIds);
  for (
    let candidate = Math.min(currentZoom + searchStep, safeMax);
    candidate <= safeMax;
    candidate = Math.min(candidate + searchStep, safeMax)
  ) {
    if (!remainsOneCluster(zones, selectedIds, candidate)) {
      return Math.min(safeMax, Math.max(currentZoom + Number.EPSILON, candidate + buffer));
    }
    if (candidate === safeMax) break;
  }

  return safeMax;
}
