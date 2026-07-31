import { test, expect } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

const API_BASE = process.env.VITE_API_BASE_URL ?? 'https://api.parktrack.live';
const BBOX_SPB = '30.30,59.95,30.32,59.97';
// Past timestamp for /occupancy (1 hour ago, ISO with Z suffix).
const PAST_AT = new Date(Date.now() - 3600_000).toISOString();
// Future timestamp for /forecasts (1 hour from now).
const FUTURE_AT = new Date(Date.now() + 3600_000).toISOString();
const ITMO_ORIGIN = { latitude: 59.9575, longitude: 30.3086 };

test.describe('Real API smoke (D-16)', () => {
  test('GET /zones?bbox=...&view=map → array shape', async ({ request }) => {
    const r = await request.get(`${API_BASE}/zones?bbox=${BBOX_SPB}&view=map`);
    expect(r.status(), `GET /zones returned ${r.status()}`).toBe(200);
    const data = await r.json();
    // Accept both bare array and { items: [...] } envelope (per Niki's contract
    // OpenAPI shows bare array; defensive accept of envelope to avoid false
    // failure if Niki adds pagination).
    const arr = Array.isArray(data) ? data : data.items;
    expect(Array.isArray(arr), 'expected array or { items: [] } envelope').toBe(true);
  });

  test('GET /zones/<id> → object with zone_id', async ({ request }) => {
    const list = await (await request.get(`${API_BASE}/zones?bbox=${BBOX_SPB}&view=map`)).json();
    const items = Array.isArray(list) ? list : list.items;
    if (!items?.length) {
      test.skip(true, 'no zones returned in test bbox — skipping detail probe');
      return;
    }
    const id = items[0].zone_id ?? items[0].id;
    const r = await request.get(`${API_BASE}/zones/${id}`);
    expect(r.status(), `GET /zones/${id} returned ${r.status()}`).toBe(200);
    const obj = await r.json();
    // Shape assertion only — value-agnostic. Per parking_zones.mdx §5.4.
    expect(obj).toHaveProperty('zone_id');
  });

  test('GET /occupancy?view=map&at=... → array shape', async ({ request }) => {
    const r = await request.get(
      `${API_BASE}/occupancy?view=map&at=${encodeURIComponent(PAST_AT)}&bbox=${BBOX_SPB}`,
    );
    expect(r.status(), `GET /occupancy returned ${r.status()}`).toBe(200);
    const data = await r.json();
    const arr = Array.isArray(data) ? data : data.items;
    expect(Array.isArray(arr)).toBe(true);
  });

  test('GET /forecasts?view=map&at=... → array shape', async ({ request }) => {
    const r = await request.get(
      `${API_BASE}/forecasts?view=map&at=${encodeURIComponent(FUTURE_AT)}&bbox=${BBOX_SPB}`,
    );
    expect(r.status(), `GET /forecasts returned ${r.status()}`).toBe(200);
    const data = await r.json();
    const arr = Array.isArray(data) ? data : data.items;
    expect(Array.isArray(arr)).toBe(true);
  });

  test('POST /routing/search → candidates array', async ({ request }) => {
    // Body shape per docs-website/docs/api/routing.mdx §8.6 +
    // Phase 4 D-37/D-38 (mode, origin, limit, provider, use_forecast).
    const r = await request.post(`${API_BASE}/routing/search`, {
      data: {
        mode: 'find_parking',
        origin: ITMO_ORIGIN,
        limit: 5,
        provider: 'yandex',
        use_forecast: true,
      },
    });
    expect(r.status(), `POST /routing/search returned ${r.status()}`).toBe(200);
    const data = await r.json();
    expect(data).toHaveProperty('candidates');
    expect(Array.isArray(data.candidates)).toBe(true);
  });

  test('POST /routing/new → route object with selected_candidate', async ({ request }) => {
    // Need a real zone_id for selected_zone_id — fetch first.
    const zones = await (await request.get(`${API_BASE}/zones?bbox=${BBOX_SPB}&view=map`)).json();
    const items = Array.isArray(zones) ? zones : zones.items;
    if (!items?.length) {
      test.skip(true, 'no zones in test bbox — skipping POST /routing/new probe');
      return;
    }
    const targetZoneId = items[0].zone_id ?? items[0].id;

    // Body per routing.mdx §8.7 — `mode: route_to_destination` requires
    // `destination`. Use the target zone's centroid (approximate via first
    // ring vertex, sufficient for smoke).
    const firstVertex = items[0].geometry?.coordinates?.[0]?.[0] ?? [
      ITMO_ORIGIN.longitude,
      ITMO_ORIGIN.latitude,
    ];
    const r = await request.post(`${API_BASE}/routing/new`, {
      data: {
        mode: 'route_to_destination',
        origin: ITMO_ORIGIN,
        destination: { latitude: firstVertex[1], longitude: firstVertex[0] },
        selected_zone_id: targetZoneId,
        provider: 'yandex',
      },
    });
    expect([200, 201], `POST /routing/new returned ${r.status()}`).toContain(r.status());
    const data = await r.json();
    // Per routing.mdx §8.5 Route model — `selected_candidate` is required.
    expect(data).toHaveProperty('selected_candidate');
  });

  test('Filters: GET /zones with all 7 filter params → 200 (D-17)', async ({ request }) => {
    // Phase 5 D-17 verification: real API accepts each of 7 filter params
    // (Phase 2 D-12 filter mapping). If any param triggers 400/422, real
    // API does NOT support it → web-map/docs/filters-contract.md update +
    // buildServerQuery.ts patch (drop unsupported param, keep client predicate).
    const params = new URLSearchParams({
      bbox: BBOX_SPB,
      view: 'map',
      min_free_count: '1',
      min_confidence: '0.5',
      max_pay: '200',
      include_private: 'false',
      include_accessible: 'false',
      hide_location_types: 'open_lot,underground',
      is_active: 'true',
    });
    const r = await request.get(`${API_BASE}/zones?${params}`);
    if (r.status() !== 200) {
      // Surface failure detail to test output for filters-contract.md update.
      console.error(
        `[filters-contract] real API rejected combined filters with status ${r.status()}: ${await r.text()}`,
      );
    }
    expect(
      r.status(),
      'real API should accept all 7 filter params (or document fallback in filters-contract.md)',
    ).toBe(200);
  });
});
