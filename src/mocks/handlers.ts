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
  http.get(`${baseUrl}/occupancy`, ({ request }) => {
    const url = new URL(request.url);
    const at = url.searchParams.get('at');
    const bboxRaw = url.searchParams.get('bbox');
    const view = url.searchParams.get('view') ?? 'series';
    if (!at) {
      return HttpResponse.json(
        { error_description: 'Missing required query: at (ISO 8601)' },
        { status: 400 },
      );
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
    // D-18 bound-check: at ∈ [now - MAX_PAST_DAYS, now]
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
  http.get(`${baseUrl}/forecasts`, ({ request }) => {
    const url = new URL(request.url);
    const at = url.searchParams.get('at');
    const bboxRaw = url.searchParams.get('bbox');
    const view = url.searchParams.get('view') ?? 'series';
    if (!at) {
      return HttpResponse.json(
        { error_description: 'Missing required query: at (ISO 8601)' },
        { status: 400 },
      );
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
    const atDate = new Date(at);
    if (atDate.getUTCHours() === 3 && atDate.getUTCMinutes() === 0) {
      return HttpResponse.json(
        { error_description: 'Прогноз на это время недоступен', items: [] },
        { status: 200 },
      );
    }
    const zones = filterByBbox(ZONES, bbox);
    if (view === 'map') {
      return HttpResponse.json(generateForecastZoneSnapshot(zones, new Date(at)));
    }
    return HttpResponse.json(generateForecasts(zones, new Date(at)));
  }),

  // ---- Routing ----
  http.post(`${baseUrl}/routing/search`, async ({ request }) => {
    const body = (await request.json()) as { from?: [number, number] };
    if (!body?.from || !Array.isArray(body.from) || body.from.length !== 2) {
      return HttpResponse.json(
        { error_description: 'Validation error: body.from = [lon, lat] required' },
        { status: 422 },
      );
    }
    const ranked = ZONES.filter((z) => z.is_active && z.free_count > 0)
      .map((z, idx) => ({
        z,
        idx,
        distance_m: haversineMeters(body.from!, zoneCentroid(z)),
      }))
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 5);
    return HttpResponse.json({
      candidates: ranked.map(({ z, idx, distance_m }) => ({
        zone_id: z.zone_id,
        distance_m: Math.round(distance_m),
        free_count: z.free_count,
        confidence: z.confidence,
        eta_seconds: Math.round((distance_m / 6) * 1.4), // ~6 м/с в городе + коэф.
        zone: toFullZone(z, idx),
      })),
    });
  }),

  http.post(`${baseUrl}/routing/new`, async ({ request }) => {
    const body = (await request.json()) as {
      from?: [number, number];
      zone_id?: number;
    };
    if (!body?.from || typeof body?.zone_id !== 'number') {
      return HttpResponse.json(
        { error_description: 'Validation error: body.from + body.zone_id required' },
        { status: 422 },
      );
    }
    const z = getZoneById(ZONES, body.zone_id);
    if (!z) {
      return HttpResponse.json({ error_description: 'Zone not found' }, { status: 404 });
    }
    const centroid = zoneCentroid(z);
    const distance_m = Math.round(haversineMeters(body.from, centroid));
    return HttpResponse.json({
      selected_candidate: {
        zone_id: z.zone_id,
        eta_seconds: 600,
        distance_m,
        polyline: [body.from, centroid],
      },
    });
  }),
];
