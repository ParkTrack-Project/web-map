// Geographic + viewport constants for the web-map.
// ITMO_CENTER: Кронверкский 49 (центр операций ParkTrack).
// Yandex Maps API v3 expects [longitude, latitude] order — DO NOT swap (PITFALLS #2).
export const ITMO_CENTER: [number, number] = [34.359757, 61.789114];
export const DEFAULT_ZOOM = 15;
// Фактический верхний предел векторной карты Yandex Maps v3. Все imperative
// zoom-переходы используют эту общую константу как fallback, если инстанс карты
// не отдал собственный zoomRange.
export const MAP_MAX_ZOOM = 21;
export const VIEWPORT_DEBOUNCE_MS = 400;
export const BBOX_ROUND_DECIMALS = 5;

export const LIVE_DATA_REFETCH_MS = 20_000;

export const ZONE_BADGE_MIN_ZOOM = 14;

export const SELECTED_ZONE_ZOOM = 16;

export const CLUSTER_MERGE_PX = 22;

export const CLUSTER_ZOOM_STEP = 0.5;

// Клик по кластеру ищет ближайшую точку его распада чаще, чем обновляются
// отрисованные кванты, и добавляет небольшой запас после найденной границы.
export const CLUSTER_EXPANSION_SEARCH_STEP = 0.25;
export const CLUSTER_EXPANSION_ZOOM_BUFFER = 0.25;

export const CLUSTER_MAX_FREE_BANDS: ReadonlyArray<{
  belowZoom: number;
  cap: number;
}> = [
  { belowZoom: 7, cap: 1400 },
  { belowZoom: 10, cap: 350 },
  { belowZoom: 13, cap: 150 },
];

export const FILTER_STORAGE_PREFIX = 'parktrack:f:v1:';

export const MAX_PAST_DAYS = 7;
export const MAX_FUTURE_HOURS = 24;
export const MIN_RESOLUTION_MINUTES = 15;

export const ROUTING_SEARCH_DEBOUNCE_MS = 300;

export const GEOLOCATION_TIMEOUT_MS = 10_000;

export const DEEPLINK_FALLBACK_MS = 2_500;

export const RESULTS_PANEL_WIDTH_PX = 400;

export const RESULTS_LIST_ITEM_HEIGHT_PX = 160;

export const SUGGEST_MIN_QUERY_LENGTH = 2;
