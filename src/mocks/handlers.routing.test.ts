// Тесты MSW handlers через прямой fetch (MSW server из tests/setup.ts).
import { describe, it, expect } from 'vitest';
import { env } from '@/shared/config';

const baseUrl = env.VITE_API_BASE_URL;

async function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('MSW /routing/search (D-37)', () => {
  it('returns 422 без mode', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      origin: { latitude: 59.93, longitude: 30.31 },
    });
    expect(res.status).toBe(422);
  });
  it('returns 422 без origin', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, { mode: 'find_parking' });
    expect(res.status).toBe(422);
  });
  it('returns 422 для mode=route_to_destination без destination', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'route_to_destination',
      origin: { latitude: 59.93, longitude: 30.31 },
    });
    expect(res.status).toBe(422);
  });
  it('returns 200 + candidates для find_parking', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
      limit: 5,
      use_forecast: false,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      mode: 'find_parking',
      provider: expect.any(String),
      generated_at: expect.any(String),
      candidates: expect.any(Array),
      total_candidates: expect.any(Number),
    });
    expect(data.candidates.length).toBeGreaterThan(0);
    expect(data.candidates.length).toBeLessThanOrEqual(5);
  });
  it('candidates sorted by score desc; rank 1-based', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
      limit: 5,
    });
    const data = await res.json();
    const scores = data.candidates.map((c: { score: number }) => c.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
    expect(data.candidates[0].rank).toBe(1);
    expect(data.candidates[data.candidates.length - 1].rank).toBe(data.candidates.length);
  });
  it('selected_zone_id === candidates[0].zone_id', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
    });
    const data = await res.json();
    expect(data.selected_zone_id).toBe(data.candidates[0].zone_id);
  });
  it('use_forecast=true → predicted_* поля не null', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
      use_forecast: true,
      limit: 1,
    });
    const data = await res.json();
    const c = data.candidates[0];
    expect(c.predicted_for_arrival).not.toBeNull();
    expect(typeof c.predicted_free_count).toBe('number');
  });
  it('use_forecast=false → predicted_* null', async () => {
    const res = await postJson(`${baseUrl}/routing/search`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
      use_forecast: false,
      limit: 1,
    });
    const data = await res.json();
    const c = data.candidates[0];
    expect(c.predicted_for_arrival).toBeNull();
    expect(c.predicted_free_count).toBeNull();
  });
});

describe('MSW /routing/new (D-38)', () => {
  it('creates route + returns full Route', async () => {
    const res = await postJson(`${baseUrl}/routing/new`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
    });
    expect(res.status).toBe(201);
    const route = await res.json();
    expect(route).toMatchObject({
      route_id: expect.any(Number),
      mode: 'find_parking',
      eta_seconds: expect.any(Number),
      arrival_time: expect.any(String),
      status: 'active',
    });
    expect(route.selected_candidate).toBeDefined();
    expect(route.selected_zone_id).toBe(route.selected_candidate.zone_id);
  });
  it('returns 422 для invalid body', async () => {
    const res = await postJson(`${baseUrl}/routing/new`, {});
    expect(res.status).toBe(422);
  });
});

describe('MSW GET /routing/<id> (D-39)', () => {
  it('returns Route после /routing/new (in-memory ROUTES)', async () => {
    const createRes = await postJson(`${baseUrl}/routing/new`, {
      mode: 'find_parking',
      origin: { latitude: 59.9575, longitude: 30.3086 },
    });
    const created = await createRes.json();
    const getRes = await fetch(`${baseUrl}/routing/${created.route_id}`);
    expect(getRes.status).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.route_id).toBe(created.route_id);
  });
  it('returns 404 для non-existent route_id', async () => {
    const res = await fetch(`${baseUrl}/routing/999999`);
    expect(res.status).toBe(404);
  });
});

describe('MSW route geometry', () => {
  it('returns a non-straight GeoJSON route', async () => {
    const res = await fetch(
      `${env.VITE_ROUTING_GEOMETRY_BASE_URL}/route/v1/driving/30.31,59.93;30.32,59.94?overview=full&geometries=geojson`,
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.code).toBe('Ok');
    expect(data.routes[0].geometry).toMatchObject({ type: 'LineString' });
    expect(data.routes[0].geometry.coordinates).toHaveLength(3);
  });
});
