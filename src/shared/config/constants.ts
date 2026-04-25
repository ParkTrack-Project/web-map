// Geographic + viewport constants for the web-map.
// ITMO_CENTER: Кронверкский 49 (центр операций ParkTrack).
// Yandex Maps API v3 expects [longitude, latitude] order — DO NOT swap (PITFALLS #2).
export const ITMO_CENTER: [number, number] = [30.3086, 59.9575];
export const DEFAULT_ZOOM = 15;
export const VIEWPORT_DEBOUNCE_MS = 400;
export const BBOX_ROUND_DECIMALS = 5;
