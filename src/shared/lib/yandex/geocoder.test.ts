import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeByUri, GeocoderError } from './geocoder';

describe('geocodeByUri (Pitfall 1 — Suggest НЕ возвращает coords inline)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('parses pos="lon lat" → returns [lat, lon] (lat first!)', async () => {
    const fakeResponse = {
      response: {
        GeoObjectCollection: {
          featureMember: [{ GeoObject: { Point: { pos: '30.30943 59.95598' } } }],
        },
      },
    };
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(fakeResponse), { status: 200 }));
    const ctrl = new AbortController();
    await expect(geocodeByUri('ymapsbm1://geo?text=...', ctrl.signal)).resolves.toEqual([
      59.95598, 30.30943,
    ]);
  });

  it('hits geocoder endpoint с правильными query params', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          response: {
            GeoObjectCollection: {
              featureMember: [{ GeoObject: { Point: { pos: '30.30943 59.95598' } } }],
            },
          },
        }),
        { status: 200 },
      ),
    );
    const ctrl = new AbortController();
    await geocodeByUri('ymapsbm1://geo?id=42', ctrl.signal);
    const callUrl = fetchSpy.mock.calls[0][0] as string;
    expect(callUrl).toContain('geocode-maps.yandex.ru/1.x/');
    expect(callUrl).toContain('apikey=');
    expect(callUrl).toContain('uri=');
    expect(callUrl).toContain('format=json');
    expect(callUrl).toContain('lang=ru_RU');
  });

  it('throws GeocoderError на пустой featureMember', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ response: { GeoObjectCollection: { featureMember: [] } } }), {
        status: 200,
      }),
    );
    const ctrl = new AbortController();
    await expect(geocodeByUri('uri', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });

  it('throws GeocoderError на malformed pos', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          response: {
            GeoObjectCollection: {
              featureMember: [{ GeoObject: { Point: { pos: 'not numbers' } } }],
            },
          },
        }),
        { status: 200 },
      ),
    );
    const ctrl = new AbortController();
    await expect(geocodeByUri('uri', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });

  it('throws GeocoderError on non-2xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Internal', { status: 500 }));
    const ctrl = new AbortController();
    await expect(geocodeByUri('uri', ctrl.signal)).rejects.toBeInstanceOf(GeocoderError);
  });
});
