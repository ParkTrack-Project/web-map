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
