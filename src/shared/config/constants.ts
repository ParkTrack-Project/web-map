// Geographic + viewport constants for the web-map.
// ITMO_CENTER: Кронверкский 49 (центр операций ParkTrack).
// Yandex Maps API v3 expects [longitude, latitude] order — DO NOT swap (PITFALLS #2).
export const ITMO_CENTER: [number, number] = [30.3086, 59.9575];
export const DEFAULT_ZOOM = 15;
export const VIEWPORT_DEBOUNCE_MS = 400;
export const BBOX_ROUND_DECIMALS = 5;

// D-02 (Phase 2): на zoom < 14 бейджи free_count скрываются, чтобы не превращать
// карту в шум; сами полигоны зон остаются видимы.
export const ZONE_BADGE_MIN_ZOOM = 14;

// D-11 (Phase 2): namespace для sessionStorage-ключей фильтров. Версионирование
// «v1» позволяет bump'нуть до v2 при schema-bump (Phase 3+) без collision'ов.
export const FILTER_STORAGE_PREFIX = 'parktrack:f:v1:';

// D-09 (Phase 3): диапазоны для TimeSelector — clamp past/future ввод.
// MVP-константы; Phase 5 интеграция с Никитой может вернуть их из API
// (`supported_range`) — тогда заменить на dynamic source.
export const MAX_PAST_DAYS = 7;
export const MAX_FUTURE_HOURS = 24;
export const MIN_RESOLUTION_MINUTES = 15;

// Phase 4 / D-26 + research Pitfall 5: единый debounce 300ms для search и
// filter-over-results refetch.
export const ROUTING_SEARCH_DEBOUNCE_MS = 300;

// Phase 4 / D-12: navigator.geolocation.getCurrentPosition timeout (Pitfall 4).
// 10s достаточно для парковки (точность ±100м); enableHighAccuracy=false ускоряет fix.
export const GEOLOCATION_TIMEOUT_MS = 10_000;

// Phase 4 / D-33 / ROUTE-07: timer-fallback после yandexnavi:// — если
// visibilitychange не пришёл за 2500ms, открываем web fallback.
export const DEEPLINK_FALLBACK_MS = 2_500;

// Phase 4 / D-18: ширина desktop ResultsPanel; используется в Tailwind class и для
// расчёта map-area-bbox при fit-to-route (D-30).
export const RESULTS_PANEL_WIDTH_PX = 400;

// Phase 4 / D-23 / RANK-06: фиксированная высота list-item в @tanstack/react-virtual.
// 140px учитывает 5 строк layout D-20 (badge + name+price+free + forecast +
// distance + confidence).
export const RESULTS_LIST_ITEM_HEIGHT_PX = 140;

// Phase 4 / SEARCH-01: минимум символов перед triggering Suggest fetch
// (research Pitfall 5 — single-letter API hits убивают free-tier quota).
export const SUGGEST_MIN_QUERY_LENGTH = 2;
