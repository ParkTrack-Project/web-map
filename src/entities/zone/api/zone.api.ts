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

    const items = Array.isArray(data?.items) ? data.items : [];

    return dedupeZonesByNearestTime(
      items as unknown as ApiZoneLike[],
      mode.kind === 'now' ? undefined : mode.at,
    ).map((item) => normalizeZoneFields(item, mode.kind)) as unknown as ZoneMapItem[];
  }

  return dedupeZonesByNearestTime(
    res.data as unknown as ApiZoneLike[],
    mode.kind === 'now' ? undefined : mode.at,
  ).map((item) => normalizeZoneFields(item, mode.kind)) as unknown as ZoneMapItem[];
}

type ApiZoneLike = Record<string, unknown>;

function parseDateMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const ms = Date.parse(value);

  return Number.isFinite(ms) ? ms : null;
}

function getApiZoneTimeMs(item: ApiZoneLike): number | null {
  return (
    parseDateMs(item.occupancy_updated_at) ??
    parseDateMs(item.observed_at) ??
    parseDateMs(item.at) ??
    parseDateMs(item.forecasted_at) ??
    parseDateMs(item.forecast_at) ??
    parseDateMs(item.predicted_for)
  );
}

function getConfidenceLevel(confidence: number): 'very_low' | 'low' | 'medium' | 'high' {
  if (confidence < 0.4) return 'very_low';
  if (confidence < 0.6) return 'low';
  if (confidence < 0.8) return 'medium';
  return 'high';
}

function normalizeZoneFields(item: ApiZoneLike, modeKind: TimeMode['kind'] = 'now'): ApiZoneLike {
  const normalized: ApiZoneLike = { ...item };

  const capacityRaw = normalized['capacity'];
  const capacity =
    typeof capacityRaw === 'number' && Number.isFinite(capacityRaw) ? capacityRaw : 0;

  const freeCountRaw =
    modeKind === 'future'
      ? (normalized['predicted_free_count'] ??
        normalized['forecasted_free_count'] ??
        normalized['free_count'] ??
        normalized['current_free_count'])
      : (normalized['free_count'] ??
        normalized['predicted_free_count'] ??
        normalized['forecasted_free_count'] ??
        normalized['current_free_count']);

  const freeCount =
    typeof freeCountRaw === 'number' && Number.isFinite(freeCountRaw) ? freeCountRaw : 0;

  const occupiedRaw =
    modeKind === 'future'
      ? (normalized['predicted_occupied'] ??
        normalized['forecasted_occupied'] ??
        normalized['occupied'])
      : (normalized['occupied'] ??
        normalized['predicted_occupied'] ??
        normalized['forecasted_occupied']);

  const occupied =
    typeof occupiedRaw === 'number' && Number.isFinite(occupiedRaw)
      ? occupiedRaw
      : Math.max(0, capacity - freeCount);

  const confidenceRaw =
    modeKind === 'future'
      ? (normalized['forecast_confidence'] ??
        normalized['prediction_confidence'] ??
        normalized['predicted_confidence'] ??
        normalized['model_confidence'] ??
        normalized['forecast_probability'] ??
        normalized['confidence'])
      : (normalized['confidence'] ??
        normalized['forecast_confidence'] ??
        normalized['prediction_confidence'] ??
        normalized['predicted_confidence'] ??
        normalized['model_confidence']);

  const confidenceNumber =
    typeof confidenceRaw === 'number'
      ? confidenceRaw
      : typeof confidenceRaw === 'string'
        ? Number(confidenceRaw)
        : 0;

  const confidence = Number.isFinite(confidenceNumber)
    ? confidenceNumber > 1
      ? confidenceNumber / 100
      : confidenceNumber
    : 0;

  const observedAt =
    normalized['observed_at'] ??
    normalized['occupancy_updated_at'] ??
    normalized['ingested_at'] ??
    null;

  const forecastTargetAt =
    normalized['displayed_at'] ??
    normalized['predicted_for'] ??
    normalized['forecasted_at'] ??
    normalized['forecast_at'] ??
    normalized['at'] ??
    null;

  const forecastCreatedAt =
    normalized['forecast_created_at'] ??
    normalized['generated_at'] ??
    normalized['model_run_at'] ??
    normalized['created_at'] ??
    normalized['ingested_at'] ??
    null;

  normalized['capacity'] = capacity;
  normalized['free_count'] = freeCount;
  normalized['occupied'] = occupied;
  normalized['confidence'] = confidence;

  if (modeKind === 'future') {
    // Важно: occupancy_updated_at для прогноза — это НЕ время, на которое прогноз.
    // Это время создания/генерации прогноза.
    normalized['occupancy_updated_at'] = forecastCreatedAt;
    normalized['forecast_created_at'] = forecastCreatedAt;
    normalized['displayed_at'] = forecastTargetAt;
  } else {
    normalized['occupancy_updated_at'] = observedAt;
    normalized['displayed_at'] = observedAt;
  }

  if (!normalized['confidence_level']) {
    normalized['confidence_level'] = getConfidenceLevel(confidence);
  }

  if (normalized['is_active'] === undefined) {
    normalized['is_active'] = true;
  }

  return normalized;
}

function dedupeZonesByNearestTime<T extends ApiZoneLike>(items: T[], targetAt?: string): T[] {
  const targetMs = targetAt ? Date.parse(targetAt) : NaN;
  const hasTarget = Number.isFinite(targetMs);

  const byZoneId = new Map<number, T>();

  for (const rawItem of items) {
    if (typeof rawItem.zone_id !== 'number') continue;

    const prev = byZoneId.get(rawItem.zone_id);

    if (!prev) {
      byZoneId.set(rawItem.zone_id, rawItem);
      continue;
    }

    if (!hasTarget) continue;

    const prevTimeMs = getApiZoneTimeMs(prev);
    const itemTimeMs = getApiZoneTimeMs(rawItem);

    if (itemTimeMs === null) continue;

    if (prevTimeMs === null || Math.abs(itemTimeMs - targetMs) < Math.abs(prevTimeMs - targetMs)) {
      byZoneId.set(rawItem.zone_id, rawItem);
    }
  }

  return [...byZoneId.values()];
}

function extractSingleZoneFromResponse(data: unknown, targetAt?: string): ApiZoneLike | null {
  if (Array.isArray(data)) {
    return dedupeZonesByNearestTime(data as ApiZoneLike[], targetAt)[0] ?? null;
  }

  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items?: unknown }).items;

    if (Array.isArray(items)) {
      return dedupeZonesByNearestTime(items as ApiZoneLike[], targetAt)[0] ?? null;
    }
  }

  if (data && typeof data === 'object') {
    return data as ApiZoneLike;
  }

  return null;
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
    return normalizeZoneFields(res.data as unknown as ApiZoneLike, 'now') as unknown as Zone;
  }
  // past/future: dispatch через timeModeAdapter, override view='card' и
  // zone_id=:id (вместо bbox для card-context).
  const { endpoint, extraParams } = timeModeAdapter(mode);

  const [modeRes, baseRes] = await Promise.all([
    apiClient.get<Zone | Zone[] | { error_description?: string; items?: Zone[] }>(endpoint, {
      params: { ...extraParams, view: 'card', zone_id: String(id) },
      signal,
    }),
    apiClient.get<Zone>(`/zones/${id}`, { signal }),
  ]);

  if (
    modeRes.data &&
    typeof modeRes.data === 'object' &&
    !Array.isArray(modeRes.data) &&
    'error_description' in modeRes.data &&
    modeRes.data.error_description
  ) {
    throw new TimeModeUnavailableError(modeRes.data.error_description, mode);
  }

  const dynamicZone = extractSingleZoneFromResponse(modeRes.data, mode.at);

  if (!dynamicZone) {
    return normalizeZoneFields(baseRes.data as unknown as ApiZoneLike) as unknown as Zone;
  }

  const baseZone = baseRes.data as unknown as ApiZoneLike;

  const merged = {
    ...baseZone,
    ...dynamicZone,

    geometry: dynamicZone['geometry'] ?? baseZone['geometry'],
    zone_type: dynamicZone['zone_type'] ?? baseZone['zone_type'],
    location_type: dynamicZone['location_type'] ?? baseZone['location_type'],
    pay: dynamicZone['pay'] ?? baseZone['pay'],
    is_private: dynamicZone['is_private'] ?? baseZone['is_private'],
    is_accessible: dynamicZone['is_accessible'] ?? baseZone['is_accessible'],
    image_polygon: dynamicZone['image_polygon'] ?? baseZone['image_polygon'],
    camera_id: dynamicZone['camera_id'] ?? baseZone['camera_id'],
    partner_id: dynamicZone['partner_id'] ?? baseZone['partner_id'],
    created_by_user_id: dynamicZone['created_by_user_id'] ?? baseZone['created_by_user_id'],

    forecast_created_at:
      dynamicZone['forecast_created_at'] ??
      dynamicZone['generated_at'] ??
      dynamicZone['model_run_at'] ??
      dynamicZone['created_at'] ??
      dynamicZone['ingested_at'] ??
      null,

    displayed_at:
      dynamicZone['displayed_at'] ??
      dynamicZone['predicted_for'] ??
      dynamicZone['forecasted_at'] ??
      dynamicZone['forecast_at'] ??
      dynamicZone['at'] ??
      null,

    forecast_confidence:
      dynamicZone['forecast_confidence'] ??
      dynamicZone['prediction_confidence'] ??
      dynamicZone['predicted_confidence'] ??
      dynamicZone['model_confidence'] ??
      dynamicZone['confidence'] ??
      null,

    created_at: dynamicZone['created_at'] ?? baseZone['created_at'],
    updated_at: dynamicZone['updated_at'] ?? baseZone['updated_at'],
  };

  console.log('[forecast card merge]', {
    baseConfidence: baseZone['confidence'],
    dynamicConfidence: dynamicZone['confidence'],
    dynamicForecastConfidence: dynamicZone['forecast_confidence'],
    mergedForecastConfidence: merged['forecast_confidence'],
    modeKind: mode.kind,
  });

  return normalizeZoneFields(merged, mode.kind) as unknown as Zone;
}
