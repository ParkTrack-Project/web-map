// Сетевой слой для зон. AbortSignal протаскивается до axios — TanStack Query
// автоматически отменяет in-flight запрос при смене queryKey (MAP-05).
//
// Phase 2 Plan 03: fetchZones принимает serverQuery (Record<string,string> от
// buildServerQuery) — сериализованные filter params, спред-нутые в axios `params`.
import { apiClient } from '@/shared/api';
import type { Bbox } from '@/shared/lib/geo';
import type { ZoneMapItem, Zone } from '../model/zone.types';

export async function fetchZones(
  bbox: Bbox,
  serverQuery: Record<string, string>,
  signal: AbortSignal,
): Promise<ZoneMapItem[]> {
  const res = await apiClient.get<ZoneMapItem[]>('/zones', {
    params: { bbox: bbox.join(','), view: 'map', ...serverQuery },
    signal,
  });
  return res.data;
}

// CARD-01: полная Zone для модального окна. AbortSignal — для отмены при
// быстром перетыке зон (D-08a) или закрытии карточки до приземления ответа.
export async function fetchZoneById(id: number, signal: AbortSignal): Promise<Zone> {
  const res = await apiClient.get<Zone>(`/zones/${id}`, { signal });
  return res.data;
}
