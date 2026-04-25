// Сетевой слой для зон. AbortSignal протаскивается до axios — TanStack Query
// автоматически отменяет in-flight запрос при смене queryKey (MAP-05).
import { apiClient } from '@/shared/api';
import type { Bbox } from '@/shared/lib/geo';
import type { ZoneMapItem } from '../model/zone.types';

export async function fetchZones(bbox: Bbox, signal: AbortSignal): Promise<ZoneMapItem[]> {
  const res = await apiClient.get<ZoneMapItem[]>('/zones', {
    params: { bbox: bbox.join(','), view: 'map' },
    signal,
  });
  return res.data;
}
