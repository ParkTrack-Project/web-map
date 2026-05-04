// Сетевой слой для зон. AbortSignal протаскивается до axios — TanStack Query
// автоматически отменяет in-flight запрос при смене queryKey (MAP-05).
//
// Phase 2 Plan 03: fetchZones принимает serverQuery (Record<string,string> от
// buildServerQuery) — сериализованные filter params, спред-нутые в axios `params`.
//
// Phase 3 Plan 01 (D-13/D-14): fetchZones теперь принимает TimeMode.
// timeModeAdapter диспатчит endpoint и extraParams. /occupancy и /forecasts MSW
// (Plan 01 Task 4) расширены так, чтобы возвращать ZoneMapItem[] (Q1 schema fix).
//
// Phase 3 Plan 04 (I-6 / Q4): wrap-shape detection — /forecasts на 03:00 UTC
// возвращает 200 + { error_description, items: [] } как deterministic триггер
// для TIME-09 empty-state. Ловим этот pattern и throw'им typed
// TimeModeUnavailableError, чтобы ZoneStateOverlay показал backend-message
// (а не дефолт «Не удалось загрузить данные»).
import { apiClient } from '@/shared/api';
import type { Bbox } from '@/shared/lib/geo';
import type { ZoneMapItem, Zone } from '../model/zone.types';
import { timeModeAdapter } from '../model/time-mode-adapter';
import type { TimeMode } from '../model/zone.types';
import { TimeModeUnavailableError } from '../model/time-mode-error';

export async function fetchZones(
  bbox: Bbox,
  serverQuery: Record<string, string>,
  mode: TimeMode,
  signal: AbortSignal,
): Promise<ZoneMapItem[]> {
  const { endpoint, extraParams } = timeModeAdapter(mode);
  const res = await apiClient.get<
    ZoneMapItem[] | { error_description?: string; items?: ZoneMapItem[] }
  >(endpoint, {
    params: { bbox: bbox.join(','), view: 'map', ...extraParams, ...serverQuery },
    signal,
  });

  // I-6 / Q4: wrap-shape detection. Если ответ — объект (не массив) с
  // error_description, throw'им TimeModeUnavailableError. Просто wrap без
  // error_description → fallback на items или [].
  if (!Array.isArray(res.data)) {
    const data = res.data;
    if (data?.error_description) {
      throw new TimeModeUnavailableError(data.error_description, mode);
    }
    return Array.isArray(data?.items) ? data.items : [];
  }
  return res.data;
}

// CARD-01 + Phase 3 Plan 05 / TIME-07: полная Zone для модального окна.
// AbortSignal — для отмены при быстром перетыке зон (D-08a) или закрытии карточки.
//
// Mode dispatch (TIME-07 card mode-awareness):
//   mode='now'    → GET /zones/:id (existing endpoint, unchanged)
//   mode='past'   → GET /occupancy?view=card&zone_id=:id&at=ISO
//   mode='future' → GET /forecasts?view=card&zone_id=:id&at=ISO
//
// MSW handlers расширены view=card branch'ом (Plan 05 Task 1 Step 3).
// Backward-compat: default mode={kind:'now'} сохраняет существующее поведение —
// все Phase 1+2 callsites (без mode arg) продолжают бить /zones/:id.
//
// Q4 wrap-shape детектится так же, как в fetchZones — { error_description }
// на не-массиве → throw TimeModeUnavailableError → ZoneCard покажет backend message.
export async function fetchZoneById(
  id: number,
  signal: AbortSignal,
  mode: TimeMode = { kind: 'now' },
): Promise<Zone> {
  if (mode.kind === 'now') {
    const res = await apiClient.get<Zone>(`/zones/${id}`, { signal });
    return res.data;
  }
  // past/future: dispatch через timeModeAdapter, override view='card' и
  // zone_id=:id (вместо bbox для card-context).
  const { endpoint, extraParams } = timeModeAdapter(mode);
  const res = await apiClient.get<Zone | { error_description?: string }>(endpoint, {
    params: { ...extraParams, view: 'card', zone_id: String(id) },
    signal,
  });
  // Q4 wrap-shape: backend сообщил, что mode на это время недоступен.
  if (
    res.data &&
    typeof res.data === 'object' &&
    'error_description' in res.data &&
    res.data.error_description
  ) {
    throw new TimeModeUnavailableError(res.data.error_description, mode);
  }
  return res.data as Zone;
}
