// MSW handlers для всех endpoint'ов Phase 1-4.
// baseUrl берётся из env.VITE_API_BASE_URL (axios с adapter:'fetch' эмитит абсолютные URL).
// /auth/me с задержкой 500мс в DEV — подсвечивает race-condition (Pitfall #7).
import { http, HttpResponse, delay } from 'msw';
import { env, MAX_PAST_DAYS, MAX_FUTURE_HOURS } from '@/shared/config';
import { generateMockAuthMe, generateMockUserProfile } from './generators/users';
import {
  generateMockZones,
  parseBbox,
  filterByBbox,
  applyMockFilters,
  getZoneById,
  toFullZone,
  zoneCentroid,
  type ZoneMapItem,
  type MockFilterParams,
} from './generators/zones';
import { generateOccupancyTimeseries, generateOccupancyZoneSnapshot } from './generators/occupancy';
import { generateForecasts, generateForecastZoneSnapshot } from './generators/forecasts';

const baseUrl = env.VITE_API_BASE_URL;

// Singleton-набор зон. Детерминирован — seed=42, count=200.
const ZONES: ZoneMapItem[] = generateMockZones({ seed: 42, count: 200 });

// Phase 4 / D-39: in-memory ROUTES для GET /routing/<id> reload-recovery.
// Tradeoff (research §Runtime State Inventory): page reload в dev очищает Map →
// ?route=<id> вернёт 404 → D-46 toast «Не удалось построить маршрут».
// Acceptable для MVP; Phase 5 backend имеет реальную persistence.
interface RoutingOriginDest {
  latitude: number;
  longitude: number;
}
interface RoutingSearchBody {
  mode: 'find_parking' | 'route_to_destination';
  origin: RoutingOriginDest;
  destination?: RoutingOriginDest;
  max_pay?: number;
  min_free_count?: number;
  min_confidence?: number;
  max_distance_to_destination_meters?: number;
  max_duration_from_origin_seconds?: number;
  include_accessible?: boolean;
  limit?: number;
  use_forecast?: boolean;
  provider?: string;
}

interface RouteCandidatePayload {
  zone_id: number;
  camera_id: number | null;
  geometry: ZoneMapItem['geometry'];
  zone_type: ZoneMapItem['zone_type'];
  location_type: ZoneMapItem['location_type'] | null;
  is_accessible: boolean | null;
  pay: number;
  capacity: number;
  current_occupied: number;
  current_free_count: number;
  current_confidence: number;
  predicted_for_arrival: string | null;
  predicted_occupied: number | null;
  predicted_free_count: number | null;
  probability_free_space: number | null;
  forecast_confidence: number | null;
  distance_from_origin_meters: number;
  duration_from_origin_seconds: number;
  distance_to_destination_meters: number | null;
  duration_to_destination_seconds: number | null;
  score: number;
  rank: number;
}

interface RouteRecord {
  route_id: number;
  user_id: number;
  mode: 'find_parking' | 'route_to_destination';
  provider: string;
  origin: RoutingOriginDest;
  destination: RoutingOriginDest | null;
  selected_zone_id: number;
  selected_candidate: RouteCandidatePayload;
  eta_seconds: number;
  arrival_time: string;
  polyline: string | null;
  deeplink_url: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'replaced';
  created_at: string;
  updated_at: string;
}

const ROUTES = new Map<number, RouteRecord>();
let nextRouteId = 7000;

// Haversine для /routing/search ранжирования (метры).
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function rankCandidates(body: RoutingSearchBody): {
  candidates: RouteCandidatePayload[];
  total: number;
} {
  // 1. Apply server-side filters (analogous /zones).
  // Phase 5 hot-fix: ranking ВСЕГДА исключает inactive + private — server design
  // assumption per applyClientCandidateFilters comment («RouteCandidate не имеет
  // is_active — server возвращает только active»). Без этого user может тапнуть
  // парковку из ranked-списка → ZoneCard показывает «Зона неактивна в этот период».
  const filterParams: MockFilterParams = {
    is_active: true,
    include_private: false,
  };
  if (body.min_free_count !== undefined) filterParams.min_free_count = body.min_free_count;
  if (body.min_confidence !== undefined) filterParams.min_confidence = body.min_confidence;
  if (body.max_pay !== undefined) filterParams.max_pay = body.max_pay;
  if (body.include_accessible !== undefined)
    filterParams.include_accessible = body.include_accessible;
  let pool = applyMockFilters(ZONES, filterParams);

  // 2. Apply max_distance_to_destination_meters
  const originLngLat: [number, number] = [body.origin.longitude, body.origin.latitude];
  const destLngLat = body.destination
    ? ([body.destination.longitude, body.destination.latitude] as [number, number])
    : null;
  if (destLngLat && body.max_distance_to_destination_meters !== undefined) {
    const maxDist = body.max_distance_to_destination_meters;
    pool = pool.filter((z) => haversineMeters(zoneCentroid(z), destLngLat) <= maxDist);
  }

  // 3. Score + rank (D-37)
  const limit = body.limit ?? 20;
  const useForecast = !!body.use_forecast;
  const ranked = pool
    .map((z, idx) => {
      const distFromOrigin = haversineMeters(originLngLat, zoneCentroid(z));
      const distToDest = destLngLat ? haversineMeters(zoneCentroid(z), destLngLat) : null;
      const proxScore = Math.max(0, 1 - distFromOrigin / 2000);
      const freeScore = Math.min(1, z.free_count / 5);
      const confScore = z.confidence;
      const priceScore = z.pay === 0 ? 1 : Math.max(0, 1 - z.pay / 500);
      const score = 0.4 * proxScore + 0.25 * freeScore + 0.2 * confScore + 0.15 * priceScore;
      return { z, idx, score, distFromOrigin, distToDest };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const candidates = ranked.map<RouteCandidatePayload>(
    ({ z, idx, score, distFromOrigin, distToDest }, rankIdx) => {
      const arrivalDate = useForecast ? new Date(Date.now() + (distFromOrigin / 6) * 1000) : null;
      return {
        zone_id: z.zone_id,
        camera_id: idx + 1,
        geometry: z.geometry,
        zone_type: z.zone_type,
        location_type: z.location_type,
        is_accessible: z.is_accessible,
        pay: z.pay,
        capacity: z.capacity,
        current_occupied: z.occupied,
        current_free_count: z.free_count,
        current_confidence: z.confidence,
        predicted_for_arrival: arrivalDate ? arrivalDate.toISOString() : null,
        predicted_occupied: useForecast
          ? Math.max(0, z.occupied + Math.round((Math.random() - 0.5) * 2))
          : null,
        predicted_free_count: useForecast
          ? Math.max(0, z.free_count + Math.round((Math.random() - 0.5) * 2))
          : null,
        probability_free_space: useForecast
          ? Math.min(1, z.free_count / Math.max(1, z.capacity * 0.4))
          : null,
        forecast_confidence: useForecast ? Math.max(0, z.confidence - 0.15) : null,
        distance_from_origin_meters: Math.round(distFromOrigin),
        duration_from_origin_seconds: Math.round(distFromOrigin / 6),
        distance_to_destination_meters: distToDest != null ? Math.round(distToDest) : null,
        duration_to_destination_seconds: distToDest != null ? Math.round(distToDest / 6) : null,
        score,
        rank: rankIdx + 1,
      };
    },
  );
  return { candidates, total: pool.length };
}

function buildRoute(body: RoutingSearchBody & { selected_zone_id?: number }): RouteRecord | null {
  const { candidates } = rankCandidates(body);
  const selected =
    body.selected_zone_id !== undefined
      ? (candidates.find((c) => c.zone_id === body.selected_zone_id) ?? candidates[0])
      : candidates[0];
  if (!selected) return null;
  const eta_seconds = selected.duration_from_origin_seconds;
  const arrival_time = new Date(Date.now() + eta_seconds * 1000).toISOString();
  const created_at = new Date().toISOString();
  const route_id = ++nextRouteId;
  const firstRing = selected.geometry.coordinates[0]!;
  const firstPoint = firstRing[0]!;
  const latTo = firstPoint[1]!;
  const lonTo = firstPoint[0]!;
  const deeplink_url = `yandexnavi://build_route_on_map?lat_to=${latTo}&lon_to=${lonTo}&lat_from=${body.origin.latitude}&lon_from=${body.origin.longitude}`;
  return {
    route_id,
    user_id: 1,
    mode: body.mode,
    provider: body.provider ?? 'yandex',
    origin: body.origin,
    destination: body.destination ?? null,
    selected_zone_id: selected.zone_id,
    selected_candidate: selected,
    eta_seconds,
    arrival_time,
    polyline: null, // D-29: MVP — straight line на client
    deeplink_url,
    status: 'active',
    created_at,
    updated_at: created_at,
  };
}

export const handlers = [
  // ---- Auth ----
  http.get(`${baseUrl}/auth/me`, async () => {
    if (import.meta.env.DEV) await delay(500);
    return HttpResponse.json(generateMockAuthMe());
  }),

  // ---- Users ----
  http.get(`${baseUrl}/users/me`, () => {
    return HttpResponse.json(generateMockUserProfile());
  }),

  // ---- Zones ----
  // Phase 2 Plan 03: handler парсит filter query params (min_free_count,
  // min_confidence, max_pay, include_private, include_accessible, is_active,
  // hide_location_types) и применяет их через applyMockFilters после filterByBbox.
  // Это эмулирует server-side filter path D-12 — E2E тест видит реальное
  // изменение количества зон при переключении фильтров.
  http.get(`${baseUrl}/zones`, ({ request }) => {
    const url = new URL(request.url);
    const bboxRaw = url.searchParams.get('bbox');
    const view = url.searchParams.get('view') ?? 'full';

    let zones: ZoneMapItem[] = ZONES;
    if (bboxRaw) {
      const bbox = parseBbox(bboxRaw);
      if (!bbox) {
        return HttpResponse.json(
          { error_description: 'Validation error: bbox must be "<w>,<s>,<e>,<n>"' },
          { status: 422 },
        );
      }
      zones = filterByBbox(zones, bbox);
    }

    // Phase 2 Plan 03: Server-side filter mapping (D-12).
    const filters: MockFilterParams = {};
    const minFree = url.searchParams.get('min_free_count');
    if (minFree !== null) filters.min_free_count = Number(minFree);
    const minConf = url.searchParams.get('min_confidence');
    if (minConf !== null) filters.min_confidence = Number(minConf);
    const maxPay = url.searchParams.get('max_pay');
    if (maxPay !== null) filters.max_pay = Number(maxPay);
    const incPriv = url.searchParams.get('include_private');
    if (incPriv !== null) filters.include_private = incPriv === 'true';
    const incAcc = url.searchParams.get('include_accessible');
    if (incAcc !== null) filters.include_accessible = incAcc === 'true';
    const isAct = url.searchParams.get('is_active');
    if (isAct !== null) filters.is_active = isAct === 'true';
    const hideLoc = url.searchParams.get('hide_location_types');
    if (hideLoc !== null) filters.hide_location_types = hideLoc.split(',').filter(Boolean);
    zones = applyMockFilters(zones, filters);

    if (view === 'map') {
      return HttpResponse.json(zones);
    }
    return HttpResponse.json(zones.map((z, i) => toFullZone(z, i)));
  }),

  http.get(`${baseUrl}/zones/:id`, ({ params }) => {
    const id = Number(params.id);
    const z = getZoneById(ZONES, id);
    if (!z) {
      return HttpResponse.json({ error_description: 'Zone not found' }, { status: 404 });
    }
    const idx = ZONES.indexOf(z);
    return HttpResponse.json(toFullZone(z, idx));
  }),

  // ---- Occupancy (исторический режим) ----
  // Phase 3 Plan 01 (Q1 fix / D-18): view=map → ZoneMapItem[] (полная зона +
  // time-skewed occupied/free_count/confidence). view=series (default) → старая
  // узкая OccupancyItem[] схема для backward-compat. Также добавлен bound-check
  // at ∈ [now - MAX_PAST_DAYS, now] → 422 OUT_OF_RANGE.
  //
  // Plan 05 / TIME-07: view=card&zone_id=N → одна полная Zone (toFullZone) с
  // time-skewed данными. Этот branch НЕ требует bbox (карточка знает zone_id).
  http.get(`${baseUrl}/occupancy`, ({ request }) => {
    const url = new URL(request.url);
    const at = url.searchParams.get('at');
    const bboxRaw = url.searchParams.get('bbox');
    const view = url.searchParams.get('view') ?? 'series';
    const zoneIdRaw = url.searchParams.get('zone_id');
    if (!at) {
      return HttpResponse.json(
        { error_description: 'Missing required query: at (ISO 8601)' },
        { status: 400 },
      );
    }
    // D-18 bound-check: at ∈ [now - MAX_PAST_DAYS, now] (применяется ко всем view-режимам).
    const atTime = new Date(at).getTime();
    if (Number.isNaN(atTime)) {
      return HttpResponse.json(
        { error_description: 'Invalid at: not a parseable ISO datetime' },
        { status: 422 },
      );
    }
    const now = Date.now();
    const lowerBound = now - MAX_PAST_DAYS * 86_400_000;
    if (atTime < lowerBound || atTime > now) {
      return HttpResponse.json(
        {
          error_description: `History only available between ${new Date(lowerBound).toISOString()} and ${new Date(now).toISOString()}`,
          code: 'OUT_OF_RANGE',
        },
        { status: 422 },
      );
    }
    // Plan 05 / TIME-07: card-уровень — полная Zone для одной зоны (НЕ массив, НЕ требует bbox).
    if (view === 'card' && zoneIdRaw) {
      const zoneId = Number(zoneIdRaw);
      const z = getZoneById(ZONES, zoneId);
      if (!z) {
        return HttpResponse.json({ error_description: 'Zone not found' }, { status: 404 });
      }
      const idx = ZONES.indexOf(z);
      const skewed = generateOccupancyZoneSnapshot([z], new Date(at))[0]!;
      const fullBase = toFullZone(z, idx);
      return HttpResponse.json({
        ...fullBase,
        occupied: skewed.occupied,
        free_count: skewed.free_count,
        confidence: skewed.confidence,
        confidence_level: skewed.confidence_level,
        occupancy_updated_at: skewed.occupancy_updated_at,
      });
    }
    if (!bboxRaw) {
      return HttpResponse.json(
        { error_description: 'Missing required query: bbox' },
        { status: 400 },
      );
    }
    const bbox = parseBbox(bboxRaw);
    if (!bbox) {
      return HttpResponse.json(
        { error_description: 'Validation error: bbox malformed' },
        { status: 422 },
      );
    }
    const zones = filterByBbox(ZONES, bbox);
    // Phase 3 Q1 fix: view=map → ZoneMapItem[]; view=series (default) → старая узкая схема
    if (view === 'map') {
      return HttpResponse.json(generateOccupancyZoneSnapshot(zones, new Date(at)));
    }
    return HttpResponse.json(generateOccupancyTimeseries(zones, new Date(at)));
  }),

  // ---- Forecasts (будущий режим) ----
  // Phase 3 Plan 01 (Q1 fix / D-19): view=map → ZoneMapItem[]; view=series (default) →
  // старая ForecastItem[]. Bound-check at ∈ [now, now + MAX_FUTURE_HOURS] → 422.
  // Q4 deterministic edge-case: ровно на 03:00:00 UTC возвращаем «прогноз недоступен»
  // (для E2E / TIME-09 empty-state триггера).
  //
  // Plan 05 / TIME-07: view=card&zone_id=N → одна полная Zone (toFullZone) с
  // forecast-семантикой. Не требует bbox. Q4 wrap-shape применяется и к card-уровню —
  // карточка увидит TimeModeUnavailableError так же, как map-уровень (zone-level
  // fallback message).
  http.get(`${baseUrl}/forecasts`, ({ request }) => {
    const url = new URL(request.url);
    const at = url.searchParams.get('at');
    const bboxRaw = url.searchParams.get('bbox');
    const view = url.searchParams.get('view') ?? 'series';
    const zoneIdRaw = url.searchParams.get('zone_id');
    if (!at) {
      return HttpResponse.json(
        { error_description: 'Missing required query: at (ISO 8601)' },
        { status: 400 },
      );
    }
    const atTime = new Date(at).getTime();
    if (Number.isNaN(atTime)) {
      return HttpResponse.json(
        { error_description: 'Invalid at: not a parseable ISO datetime' },
        { status: 422 },
      );
    }
    const now = Date.now();
    const upperBound = now + MAX_FUTURE_HOURS * 3_600_000;
    if (atTime < now || atTime > upperBound) {
      return HttpResponse.json(
        {
          error_description: `Forecasts only available between ${new Date(now).toISOString()} and ${new Date(upperBound).toISOString()}`,
          code: 'OUT_OF_RANGE',
        },
        { status: 422 },
      );
    }
    // Q4 deterministic edge-case: ровно на 03:00:00.000 UTC прогноз «недоступен».
    // Дает E2E/UAT стабильный триггер для TIME-09 «прогноз недоступен» empty-state.
    // Plan 05: применяется ко всем view-режимам (включая card) — fetchZoneById
    // ловит wrap-shape и throw'ит TimeModeUnavailableError.
    const atDate = new Date(at);
    if (atDate.getUTCHours() === 3 && atDate.getUTCMinutes() === 0) {
      return HttpResponse.json(
        { error_description: 'Прогноз на это время недоступен', items: [] },
        { status: 200 },
      );
    }
    // Plan 05 / TIME-07: card-уровень — полная Zone для одной зоны (forecast).
    if (view === 'card' && zoneIdRaw) {
      const zoneId = Number(zoneIdRaw);
      const z = getZoneById(ZONES, zoneId);
      if (!z) {
        return HttpResponse.json({ error_description: 'Zone not found' }, { status: 404 });
      }
      const idx = ZONES.indexOf(z);
      const skewed = generateForecastZoneSnapshot([z], new Date(at))[0]!;
      const fullBase = toFullZone(z, idx);
      return HttpResponse.json({
        ...fullBase,
        occupied: skewed.occupied,
        free_count: skewed.free_count,
        confidence: skewed.confidence,
        confidence_level: skewed.confidence_level,
        occupancy_updated_at: skewed.occupancy_updated_at,
      });
    }
    if (!bboxRaw) {
      return HttpResponse.json(
        { error_description: 'Missing required query: bbox' },
        { status: 400 },
      );
    }
    const bbox = parseBbox(bboxRaw);
    if (!bbox) {
      return HttpResponse.json(
        { error_description: 'Validation error: bbox malformed' },
        { status: 422 },
      );
    }
    const zones = filterByBbox(ZONES, bbox);
    if (view === 'map') {
      return HttpResponse.json(generateForecastZoneSnapshot(zones, new Date(at)));
    }
    return HttpResponse.json(generateForecasts(zones, new Date(at)));
  }),

  // ---- Routing (Phase 4 / D-37/D-38/D-39) ----
  // POST /routing/search per routing.mdx §8.6 — body {mode, origin, destination?, ...},
  // response {mode, provider, generated_at, candidates, selected_zone_id, total_candidates}.
  http.post(`${baseUrl}/routing/search`, async ({ request }) => {
    const body = (await request.json()) as Partial<RoutingSearchBody>;
    // 422 validation per §8.6
    if (
      !body?.mode ||
      !body?.origin ||
      typeof body.origin.latitude !== 'number' ||
      typeof body.origin.longitude !== 'number'
    ) {
      return HttpResponse.json(
        {
          error_description: 'Validation error: mode + origin (latitude, longitude) required',
        },
        { status: 422 },
      );
    }
    if (
      body.mode === 'route_to_destination' &&
      (!body.destination ||
        typeof body.destination.latitude !== 'number' ||
        typeof body.destination.longitude !== 'number')
    ) {
      return HttpResponse.json(
        {
          error_description: 'Validation error: destination required for mode=route_to_destination',
        },
        { status: 422 },
      );
    }
    const { candidates, total } = rankCandidates(body as RoutingSearchBody);
    return HttpResponse.json({
      mode: body.mode,
      provider: body.provider ?? 'yandex',
      generated_at: new Date().toISOString(),
      candidates,
      selected_zone_id: candidates[0]?.zone_id ?? null,
      total_candidates: total,
    });
  }),

  // POST /routing/new per routing.mdx §8.7 — same body shape as search +
  // optional selected_zone_id; persists to in-memory ROUTES Map (D-39 reload-recovery).
  http.post(`${baseUrl}/routing/new`, async ({ request }) => {
    const body = (await request.json()) as Partial<
      RoutingSearchBody & { selected_zone_id?: number }
    >;
    if (
      !body?.mode ||
      !body?.origin ||
      typeof body.origin.latitude !== 'number' ||
      typeof body.origin.longitude !== 'number'
    ) {
      return HttpResponse.json(
        { error_description: 'Validation error: mode + origin required' },
        { status: 422 },
      );
    }
    if (body.mode === 'route_to_destination' && !body.destination) {
      return HttpResponse.json(
        {
          error_description: 'Validation error: destination required for mode=route_to_destination',
        },
        { status: 422 },
      );
    }
    const route = buildRoute(body as RoutingSearchBody & { selected_zone_id?: number });
    if (!route) {
      return HttpResponse.json(
        { error_description: 'Не удалось подобрать парковку под фильтры' },
        { status: 422 },
      );
    }
    ROUTES.set(route.route_id, route);
    return HttpResponse.json(route, { status: 201 });
  }),

  // GET /routing/<id> per routing.mdx §8.9 — D-28 reload-recovery.
  http.get(`${baseUrl}/routing/:id`, ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return HttpResponse.json({ error_description: 'Route not found' }, { status: 404 });
    }
    const route = ROUTES.get(id);
    if (!route) {
      return HttpResponse.json({ error_description: 'Route not found' }, { status: 404 });
    }
    return HttpResponse.json(route);
  }),
];
